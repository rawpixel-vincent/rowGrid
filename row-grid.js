var rowGrid = {
  resizeHandled: false,
  container: null,
};

/**
 * Init method of rowGrid.
 */
rowGrid.init = function(container, options) {
  if (container === null || container === undefined) {
    return;
  }

  this.container = container;

  if (!options) {
    this.options = JSON.parse(container.getAttribute('data-row-grid'));
  } else {
    this.options = options;
    if (options.resize === undefined) this.options.resize = true;
    if (options.minWidth === undefined) this.options.minWidth = 0;
    if (options.lastRowClass === undefined) this.options.lastRowClass = 'last-row';
    if (options.mode === undefined) this.options.mode = 'grid';
  }
  
  this.layout();

  if (this.options.resize && !this.resizeHandled) {
    this.resizeHandled = true;
    window.addEventListener('resize', this.handleWindowResize.bind(this));
  }
  
};

/**
 * Call this function when you append new element to the grid.
 */
rowGrid.append = function() {
  var lastRow = this.container.getElementsByClassName(this.options.lastRowClass)[0];
  var items = this.nextAll(lastRow);
  this.layout(items);
};

/**
 * Handle Window resize.
 */
rowGrid.handleWindowResize = function(event) {
  this.layout();
};

/**
 * Handle Window resize.
 */
rowGrid.switchMode = function(mode) {
  this.options.mode = mode;
  this.layout();
};

/* Get elem and all following siblings of elem */
rowGrid.nextAll = function(elem) {
  var matched = [elem];

  while ((elem = elem['nextSibling']) && elem.nodeType !== 9) {
    if (elem.nodeType === 1) {
      matched.push(elem);
    }
  }
  return matched;
}

/**
 * Method that recalculate the layout.
 */
rowGrid.layout = function (items) {
  var items = Array.prototype.slice.call(items || this.container.querySelectorAll(this.options.itemSelector));
  
  // Read.
  var itemAttrs = this.getItemsAttributes(items);
  
  
  // write
  if (this.options.mode == 'grid') {
    this.updateItemsAttributesGrid(items, itemAttrs);
  }
  else {
    this.updateItemsAttributesList(items, itemAttrs);
  }
};

/**
 * Get the items (img) original attributes.
 */
rowGrid.getItemsAttributes = function(items) {
  var itemsSize = items.length;
  var itemAttrs = [];
  var theImage, w, h;
  for (var i = 0; i < itemsSize; ++i) {
    theImage = items[i].getElementsByTagName('img')[0];
    if (!theImage) {
      items.splice(i, 1);
      --i;
      --itemsSize;
      continue;
    }
    // get width and height via attribute or js value
    if (!(w = parseInt(theImage.getAttribute('width')))) {
      theImage.setAttribute('width', w = theImage.offsetWidth);
    }
    if (!(h = parseInt(theImage.getAttribute('height')))) {
      theImage.setAttribute('height', h = theImage.offsetHeight);
    }

    itemAttrs[i] = {
      width: w,
      height: h
    };
  }
  
  return itemAttrs;
}

/**
 * Update the items attributes in a grid mode.
 */
rowGrid.updateItemsAttributesGrid = function(items, itemAttrs) {
  var rowWidth = 0;
  var rowElems = [];
  var itemsSize = items.length;
  var containerStyle = getComputedStyle(this.container);
  var containerWidth = Math.floor(this.container.getBoundingClientRect().width) - parseFloat(containerStyle.getPropertyValue('padding-left')) - parseFloat(containerStyle.getPropertyValue('padding-right'));

  for (var index = 0; index < itemsSize; ++index) {
    if (items[index].classList) {
      items[index].classList.remove(this.options.firstItemClass);
      items[index].classList.remove(this.options.lastRowClass);
    } else {
      // IE <10
      items[index].className = items[index].className.replace(new RegExp('(^|\\b)' + this.options.firstItemClass + '|' + this.options.lastRowClass + '(\\b|$)', 'gi'), ' ');
    }

    // add element to row
    rowWidth += itemAttrs[index].width;
    rowElems.push(items[index]);

    // check if it is the last element
    if (index === itemsSize - 1) {
      for (var rowElemIndex = 0; rowElemIndex < rowElems.length; rowElemIndex++) {
        // if first element in row
        if (rowElemIndex === 0) {
          rowElems[rowElemIndex].className += ' ' + this.options.lastRowClass;
        }

        var css = 'width: ' + itemAttrs[index + parseInt(rowElemIndex) - rowElems.length + 1].width + 'px;' +
        'height: ' + itemAttrs[index + parseInt(rowElemIndex) - rowElems.length + 1].height + 'px;';

        if (rowElemIndex < rowElems.length - 1) {
          css += 'margin-right:' + this.options.minMargin + 'px';
        }

        rowElems[rowElemIndex].style.cssText = css;
      }
    }

    // check whether width of row is too high
    if (rowWidth + this.options.maxMargin * (rowElems.length - 1) > containerWidth || window.innerWidth < this.options.minWidth) {
      var diff = rowWidth + this.options.maxMargin * (rowElems.length - 1) - containerWidth;
      var nrOfElems = rowElems.length;

      // change margin
      var maxSave = (this.options.maxMargin - this.options.minMargin) * (nrOfElems - 1);
      if (maxSave < diff) {
        var rowMargin = this.options.minMargin;
        diff -= (this.options.maxMargin - this.options.minMargin) * (nrOfElems - 1);
      } else {
        var rowMargin = this.options.maxMargin - diff / (nrOfElems - 1);
        diff = 0;
      }

      var rowElem,
        newHeight = null,
        widthDiff = 0;
      for (var rowElemIndex = 0; rowElemIndex < rowElems.length; rowElemIndex++) {
        rowElem = rowElems[rowElemIndex];

        var rowElemWidth = itemAttrs[index + parseInt(rowElemIndex) - rowElems.length + 1].width;
        var newWidth = rowElemWidth - (rowElemWidth / rowWidth) * diff;
        newHeight = newHeight || Math.round(itemAttrs[index + parseInt(rowElemIndex) - rowElems.length + 1].height * (newWidth / rowElemWidth));

        if (widthDiff + 1 - newWidth % 1 >= 0.5) {
          widthDiff -= newWidth % 1;
          newWidth = Math.floor(newWidth);
        } else {
          widthDiff += 1 - newWidth % 1;
          newWidth = Math.ceil(newWidth);
        }

        var css = 'width: ' + newWidth + 'px;' +
          'height: ' + newHeight + 'px;';

        if (rowElemIndex < rowElems.length - 1) {
          css += 'margin-right: ' + rowMargin + 'px';
        }

        rowElem.style.cssText = css;

        if (rowElemIndex === 0 && !!this.options.firstItemClass) {
          rowElem.className += ' ' + this.options.firstItemClass;
        }
      }

      rowElems = [],
        rowWidth = 0;
    }
  }
};

/**
 * Update the items attributes in a list mode.
 */
rowGrid.updateItemsAttributesList = function(items, itemAttrs) {
  var rowWidth = 0;
  var itemsSize = items.length;
  var containerStyle = getComputedStyle(this.container);
  var containerWidth = Math.floor(this.container.getBoundingClientRect().width) - parseFloat(containerStyle.getPropertyValue('padding-left')) - parseFloat(containerStyle.getPropertyValue('padding-right'));

  for (var index = 0; index < itemsSize; ++index) {
    if (items[index].classList) {
      items[index].classList.remove(this.options.firstItemClass);
      items[index].classList.remove(this.options.lastRowClass);
    } else {
      // IE <10
      items[index].className = items[index].className.replace(new RegExp('(^|\\b)' + this.options.firstItemClass + '|' + this.options.lastRowClass + '(\\b|$)', 'gi'), ' ');
    }
    if (index === itemsSize - 1) {
      items[index].className += ' ' + this.options.lastRowClass;
    }
    if (index === 0 && !!this.options.firstItemClass) {
      items[index].className += ' ' + this.options.firstItemClass;
    }
    
    var newWidth = itemAttrs[index].width;
    var newHeight = itemAttrs[index].height;
    
    if (containerWidth < newWidth) {
      var ratio = containerWidth / newWidth;
      newWidth = containerWidth;
      newHeight = Math.round(itemAttrs[index].height * ratio);
    }
    
    var css = 'width: ' + newWidth + 'px;' +
    'height: ' + newHeight + 'px;';


    items[index].style.cssText = css;
  }
};


if (typeof exports === 'object') {
  module.exports = rowGrid;
}
