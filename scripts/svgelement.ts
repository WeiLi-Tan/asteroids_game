/** 
 * a little wrapper for creating SVG elements and getting/setting their attributes
 * and observing their events.
 * inspired by d3.js (http://d3js.org)
 */
class Elem {
  // parent HTMLElement of the element
  private canvas: HTMLElement;
  // Element representing the instance object
  elem: Element;
  // flag to indicate if the element will wrap around the canvas or not
  private wrapping: Boolean = false;
  // an array to store the children elem of this elem
  children:Elem[] = [];

  /**
   * @param canvas is the parent SVG object that will host the new element
   * @param tag could be "rect", "line", "ellipse", etc.
   */
  constructor(canvas: HTMLElement, tag: string, parentElem?: Elem) {
    this.canvas = canvas;
    this.elem = document.createElementNS(canvas.namespaceURI, tag);
    const parent = parentElem == undefined? canvas: parentElem.elem;
    parent.appendChild(this.elem);

    if (parentElem != undefined){
      parentElem.children.push(this);
    }
  }

  /**
   * all purpose attribute getter/setter
   * @param name attribute name
   * @param value value to assign to the attribute
   * @returns called with just the name of the attribute it returns the attribute's current value as a string, called with the name and a new value it sets the attribute and returns this object
   * so subsequent calls can be chained
   */
  attr(name: string): string 
  attr(name: string, value: string | number): this
  attr(name: string, value?: string | number): this | string {
    if (typeof value === 'undefined') {
      return this.elem.getAttribute(name)!;
    }
    this.elem.setAttribute(name, value.toString());
    return this;
  }
  /**
   * @returns an Observable for the specified event on this element
   */
  observe<T extends Event>(event: string): Observable<T> {
    return Observable.fromEvent<T>(this.elem, event);
  }

  /**
   * Get the value of specific transformation of the svg element
   * @param val number representing the transformation
   * @param transformation string representing the transformation
   * @returns value of the transformation, 0 if the transformation is not specified in the svg element
   */
  private getTransformation(val: number, transformation: string): number {
    return !this.attr("transform") || !this.attr("transform").includes(transformation)? 
    0:  String(this.attr("transform"))
        .split(' ')
        .map((s) => s.replace(/translate|rotate|\(|\)/g,''))
        .map(Number)[val]
      ;
  }

  // get x coordinate of the element
  getX = (): number => this.getTransformation(0, "translate")
  // get y coordinate of the element
  getY = (): number => this.getTransformation(1, "translate")
  // get degree of rotation of the element
  getDeg = (): number => this.getTransformation(2, "rotate")

  /**
   * Change the x and y coordinate of the element in the direction specified by its degree with scale specified by speed
   * @param speed distance to which the element is to be moved
   * @returns the svg element with new x and y position
   */
  moveInDirection(speed: number): this{
    const newX: number = this.getX() + speed * Math.sin(this.getDeg() * Math.PI / 180);
    const newY: number = this.getY() - speed * Math.cos(this.getDeg() * Math.PI / 180);
    return this.wrapping? this.wrapAround(newX, newY): this.translate(newX, newY);
  }

  /**
   * Wrap the element around the canvas if it is out of canvas
   * @param x current x position of element
   * @param y current y position of element
   * @returns the svg element with new x and y position
   */
  private wrapAround(x: number, y: number): this{
    const maxWidth = parseInt(this.canvas.getAttribute("width")!),
          maxHeight = parseInt(this.canvas.getAttribute("height")!),
          minWidth = 0, 
          minHeight = 0;

    let newX = x, newY = y;
    
    if (this.getX() <= minWidth) {newX += maxWidth}
    if (this.getX() >= maxWidth) {newX -= maxWidth}
    if (this.getY() <= minHeight) {newY += maxHeight}
    if (this.getY() >= maxHeight) {newY -= maxHeight}

    this.translate(newX, newY);

    return this;
  }

  /**
   * translate this element by x and y
   * @param x x-coordinate of translation
   * @param y y-coordinate of translation
   * @returns the svg element with the specified x and y coordinate
   */
  translate(x:number, y:number): this {
    return this.attr("transform", "translate(" + x + " " + y + ") " + "rotate(" + this.getDeg() + ")");
  }

  /**
   * rotate this element by degree specified
   * @param deg degree of rotation
   * @returns the svg element with the specified degree
   */
  rotate(deg:number): this {
    let newDeg = this.getDeg() + deg;
    return this.attr("transform", "translate(" + this.getX() + " " + this.getY() + ") " + "rotate(" + newDeg + ")");
  }

  /**
   * set the wrapping attribute of svg element to true
   * @returns the svg element with wrapping set to true
   */
  wrapAroundCanvas(): this {
    this.wrapping = true;
    return this;
  }

  /**
   * Removed the child element node from current element node, in both the DOM and the children attributes of Elem.
   * @param child child element node to be removed from the current element node
   */
  removeChild(child: Elem) {

    if (this.elem.contains(child.elem)){
      this.elem.removeChild(child.elem);
      child.elem.remove();
    }
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
    }
  }


}

