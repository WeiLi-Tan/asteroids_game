"use strict";
class Elem {
    constructor(canvas, tag, parentElem) {
        this.wrapping = false;
        this.children = [];
        this.getX = () => this.getTransformation(0, "translate");
        this.getY = () => this.getTransformation(1, "translate");
        this.getDeg = () => this.getTransformation(2, "rotate");
        this.canvas = canvas;
        this.elem = document.createElementNS(canvas.namespaceURI, tag);
        const parent = parentElem == undefined ? canvas : parentElem.elem;
        parent.appendChild(this.elem);
        if (parentElem != undefined) {
            parentElem.children.push(this);
        }
    }
    attr(name, value) {
        if (typeof value === 'undefined') {
            return this.elem.getAttribute(name);
        }
        this.elem.setAttribute(name, value.toString());
        return this;
    }
    observe(event) {
        return Observable.fromEvent(this.elem, event);
    }
    getTransformation(val, transformation) {
        return !this.attr("transform") || !this.attr("transform").includes(transformation) ?
            0 : String(this.attr("transform"))
            .split(' ')
            .map((s) => s.replace(/translate|rotate|\(|\)/g, ''))
            .map(Number)[val];
    }
    moveInDirection(speed) {
        const newX = this.getX() + speed * Math.sin(this.getDeg() * Math.PI / 180);
        const newY = this.getY() - speed * Math.cos(this.getDeg() * Math.PI / 180);
        return this.wrapping ? this.wrapAround(newX, newY) : this.translate(newX, newY);
    }
    wrapAround(x, y) {
        const maxWidth = parseInt(this.canvas.getAttribute("width")), maxHeight = parseInt(this.canvas.getAttribute("height")), minWidth = 0, minHeight = 0;
        let newX = x, newY = y;
        if (this.getX() <= minWidth) {
            newX += maxWidth;
        }
        if (this.getX() >= maxWidth) {
            newX -= maxWidth;
        }
        if (this.getY() <= minHeight) {
            newY += maxHeight;
        }
        if (this.getY() >= maxHeight) {
            newY -= maxHeight;
        }
        this.translate(newX, newY);
        return this;
    }
    translate(x, y) {
        return this.attr("transform", "translate(" + x + " " + y + ") " + "rotate(" + this.getDeg() + ")");
    }
    rotate(deg) {
        let newDeg = this.getDeg() + deg;
        return this.attr("transform", "translate(" + this.getX() + " " + this.getY() + ") " + "rotate(" + newDeg + ")");
    }
    wrapAroundCanvas() {
        this.wrapping = true;
        return this;
    }
    removeChild(child) {
        if (this.elem.contains(child.elem)) {
            this.elem.removeChild(child.elem);
            child.elem.remove();
        }
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
        }
    }
}
//# sourceMappingURL=svgelement.js.map