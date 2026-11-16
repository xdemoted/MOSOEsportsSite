const link = document.createElement("link")
let path = window.location.pathname.split("/")
path = path.filter(v => v != "")

let relToRoot = ""

for (let i = 0; i < path.length - 1; i++) {
    relToRoot += "../"
}

if (relToRoot.length > 0) relToRoot = "/"

link.rel = "stylesheet"
link.href = `${relToRoot}protected/modules/table/table.css`

document.head.appendChild(link)

export class Table {
    table = document.createElement("div");
    columns = this.table.childNodes;

    primaryColor = "#333"
    borderColor = "#878787"

    buttonCount = 0

    constructor(parent, primaryColor, borderColor) {
        this.table.className = "table"
        console.log(parent)
        parent.appendChild(this.table)

        if (primaryColor) this.primaryColor = primaryColor
        if (borderColor) this.borderColor = borderColor

        this.table.style.backgroundColor = this.borderColor
        this.table.style.borderColor = this.borderColor

        this.updateView()

        window.addEventListener("resize", () => {
            this.updateView()
        })
    }

    getTable() {
        return this.table;
    }

    addColumn(title, span, name) {
        span = span ? span : 1

        const col = document.createElement("div")

        col.className = name
        col.style = `flex: ${span} 0 0`

        const h1 = document.createElement("h1")

        h1.innerText = title
        h1.style.backgroundColor = this.primaryColor
        col.appendChild(h1)

        this.table.appendChild(col)
        return col
    }

    addButton(src, primaryColor, borderColor) {
        const col = this.addColumn("", 1, "ico")
        col.setAttribute("data-src", src)

        if (borderColor && primaryColor) {
            col.setAttribute("data-primary", primaryColor)
            col.setAttribute("data-border", borderColor)
        }

        this.buttonCount++
    }

    addRow(data) {
        this.columns.forEach((col, i) => {
            if (col.className.includes("ico")) {
                const src = col.getAttribute("data-src")
                const primaryColor = col.getAttribute("data-primary")
                const borderColor = col.getAttribute("data-border")
                const div = document.createElement("div")
                const img = document.createElement("img")

                div.appendChild(img)
                div.style.backgroundColor = this.primaryColor

                if (data[i]) {
                    img.addEventListener("click", () => {
                        window.location = window.location.protocol + "//" + window.location.host + data[i]
                    })
                }

                img.src = src
                img.style = `border-color: ${borderColor}; background-color: ${primaryColor}`

                col.appendChild(div)
                return;
            }

            const p = document.createElement("p")
            p.innerHTML = data[i]
            p.style.backgroundColor = this.primaryColor
            col.appendChild(p)
        })
    }

    updateView() {
        let totalWidth = this.table.offsetWidth

        totalWidth -= this.buttonCount * 35
        
        this.columns.forEach(col => {
            const colWidth = this.getCH(col.firstChild.innerText.length) + 60

            if (totalWidth - colWidth > 0) {
                totalWidth -= colWidth
                col.style.display = "flex"
            } else if (col.className != "ico") {
                col.style.display = "none"
            }
        })
    }

    getCH(length) {
        // Create a temporary element
        const temp = document.createElement('span');
        temp.style.fontFamily = "Arial"
        temp.style.fontSize = "14px"
        temp.style.width = '1ch';
        temp.style.position = 'absolute';
        temp.style.visibility = 'hidden';
        temp.style.whiteSpace = 'nowrap';
        temp.textContent = '0'; // '0' is the reference glyph for 1ch

        document.body.appendChild(temp);

        // Get computed width in pixels
        const pixels = temp.getBoundingClientRect().width;

        // Clean up
        document.body.removeChild(temp);

        return Math.ceil(pixels) * length;
    }
}