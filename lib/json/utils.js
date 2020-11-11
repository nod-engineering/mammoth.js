function getReadableElement (tagName) {
    const elMapping = {
        p: 'paragraph',
        img: 'image',
        tr: 'table_row',
        td: 'table_cell',
        th: 'table_cell',
        a: 'link',
        br: 'paragraph' // if break, make it a new paragraph
    };
    return elMapping[tagName] || tagName
}

exports.getReadableElement = getReadableElement;