var _ = require("underscore");
var get = require('lodash').get;
var isEmpty = require('lodash').isEmpty;
var getReadableElement = require('../json/utils').getReadableElement;
var TEXT_STYLE_TAGS = ['bold', 'italic', 'underlined'];
var DEFERRED_TYPES = ['th', 'forceWrite'];

exports.writer = writer;

function writer() {
    return simpleWriter();
}

function simpleWriter() {
    function element(node, assetsArray, parentEl) {
        const tagName = getReadableElement(node.tag.tagName);
        const parenType = parentEl.type;
        if(DEFERRED_TYPES.includes(tagName)) return;
        if(tagName === 'image') {
            assetsArray.push({
                src: get(node, 'tag.attributes.src', ''),
                type: tagName,
                children: [
                    {
                        text: '',
                        marks: [],
                    }
                ],
            })
        } else if(parenType === 'table') {
            const trIndex = parentEl.children.length === 0 ? 0 : parentEl.children.length -1;
            if(tagName === 'table_row') {
                parentEl.children.push({
                    type: tagName,
                    children: [],
                })
            }
            if(tagName === 'table_cell') {
                const colspan =  parseInt(get(node.tag.attributes, 'colspan', 0), 10);
                const rowspan =  parseInt(get(node.tag.attributes, 'rowspan', 0), 10);
                const cellData = {
                    ...(colspan > 1 || rowspan > 1 ? (
                        {
                        ...({colspan: colspan === 0 && rowspan > 1 ? 1 : colspan}),
                        ...({rowspan: rowspan === 0 && colspan > 1 ? 1: rowspan }),
                    }) : {})
                }
                parentEl.children[trIndex].children.push({
                    type: tagName,
                    ...cellData,
                    children: [],
                })
            }
            if(tagName === 'paragraph') {
                if(parentEl.children[trIndex].type !== 'table_row') return;
                const tdIndex = parentEl.children[trIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children.length -1;
                parentEl.children[trIndex].children[tdIndex].children.push({
                    type: tagName,
                    children: [],
                })
            }
            if(TEXT_STYLE_TAGS.includes(tagName)) {
                const tdIndex = parentEl.children[trIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children.length -1;
                const pIndex = parentEl.children[trIndex].children[tdIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children[tdIndex].children.length - 1;
                const pEl = parentEl.children[trIndex].children[tdIndex].children[pIndex];
                if(pEl.type === 'ul') {
                    const lIndex = pEl.children.length === 0 ? 0 : pEl.children.length - 1;
                    pEl.children[lIndex].children.push({
                        type: 'li',
                        children: [{
                            text: '',
                            marks: [{
                                type: tagName,
                                object: 'mark'
                            }],
                        }],
                    });
                }
                else {
                    pEl.children.push({
                        text: '',
                        marks: [{
                            data: {},
                            type: tagName,
                            object: 'mark'
                        }],
                    });
                }
            }
            if(['ul', 'ul'].includes(tagName)) {
                const tdIndex = parentEl.children[trIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children.length -1;
                parentEl.children[trIndex].children[tdIndex].children.push({
                    type: tagName,
                    children: [],
                })
            }
            if(tagName === 'li') {
                const tdIndex = parentEl.children[trIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children.length -1;
                const pIndex = parentEl.children[trIndex].children[tdIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children[tdIndex].children.length - 1;
                parentEl.children[trIndex].children[tdIndex].children[pIndex].children.push({
                    type: 'li',
                    children: [],
                })
            }
            if(tagName === 'link' && _.has(node.tag.attributes, 'href')) {
                const tdIndex = parentEl.children[trIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children.length -1;
                const pIndex = parentEl.children[trIndex].children[tdIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children[tdIndex].children.length - 1;
                const pEl = parentEl.children[trIndex].children[tdIndex].children[pIndex];
                pEl.children.push({
                    href: node.tag.attributes.href,
                    type: tagName,
                    children: [
                        {
                            text: '',
                            marks: [],
                        }
                    ],
                });
            }
        } else if(['ul', 'ol'].includes(parenType)) {
            if(tagName === 'li') {
                parentEl.children.push({
                    type: 'li',
                    children: [],
                });
            } else if(TEXT_STYLE_TAGS.includes(tagName)) {
                const listItemIndex = parentEl.children.length - 1 || 0;

                parentEl.children[listItemIndex].children.push({
                    data: {},
                    type: 'paragraph',
                    children: [{
                        text: '',
                        marks: [{
                            data: {},
                            type: tagName,
                        }],
                    }],
                });
                
            } else if(tagName === 'link' && _.has(node.tag.attributes, 'href')) {
                const listItemIndex = parentEl.children.length - 1 || 0;
                const listItemChildIndex = parentEl.children[listItemIndex].children.length -1 || 0;
                parentEl.children[listItemIndex].children[listItemChildIndex].children.push({
                    href: node.tag.attributes.href,
                    type: tagName,
                    children: [
                        {
                            text: '',
                            marks: [],
                        }
                    ],
                })
            }
            

        } else if(tagName === 'link' && _.has(node.tag.attributes, 'href')) {
            parentEl.children.push({
                href: node.tag.attributes.href,
                type: tagName,
                children: [
                    {
                        text: '',
                        marks: [],
                    }
                ],
            })
        } else if(TEXT_STYLE_TAGS.includes(tagName)) {
            parentEl.children.push({
                text: '',
                marks: [node.tag.tagNames],
            });
            
        }
    }
    
    function text(value, parentEl) {
        const textObj = {
            text: value,
            marks: [],
        };
        if(_.has(parentEl, 'children')) {
            const isList = parentEl.type === 'ul' || parentEl.type === 'ol';
            const isTable = parentEl.type === 'table';
            const childrenIndex = parentEl.children.length === 0 ? 0 : parentEl.children.length -1;
            if(isTable) {
                const trIndex = childrenIndex;
                if(parentEl.children[trIndex].type !== 'table_row') return;
                const tdIndex = parentEl.children[trIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children.length -1;
                if(parentEl.children[trIndex].children[tdIndex].type !== 'table_cell') return;
                const pIndex = parentEl.children[trIndex].children[tdIndex].children.length === 0 ? 0 : parentEl.children[trIndex].children[tdIndex].children.length -1;
                const pEl =  parentEl.children[trIndex].children[tdIndex].children[pIndex];
                if(!pEl || !_.has(pEl, 'children')) return;
                const pElIndex = pEl.children.length === 0 ? 0 : pEl.children.length - 1;
                if(['ul', 'li'].includes(pEl.type)) {
                    const listIndex = pEl.children.length === 0 ? 0 : pEl.children.length - 1;
                    const childIndex = pEl.children[listIndex].children.length === 0 ? 0 : pEl.children[listIndex].children.length - 1;
                    const childEl = pEl.children[listIndex].children[childIndex];
                  
                    if(childEl) {
                        const childElIndex = childEl.children.length === 0 ? 0 : childEl.children.length - 1;
                        if(_.has(childEl.children[childElIndex], 'text') && childEl.children[childElIndex].text === '') {
                            childEl.children[childElIndex].text = value;
                        } else {
                            pEl.children[listIndex].children.push({
                                type: 'li',
                                children: [textObj],
                            })
                        }
                        
                    } else {
                        pEl.children[listIndex].children.push({
                            type: 'paragraph',
                            children: [textObj],
                        })
                    }
                    

                } else if(pEl && _.has(pEl.children[pElIndex], 'marks') && pEl.children[pElIndex].marks.length > 0) {
                    pEl.children[pElIndex].text = value;
                } else if(pEl && !isEmpty(get(pEl.children[pElIndex], 'href'))) {
                    const pTextIndex = pEl.children[pElIndex].children.length === 0 ? 0 : pEl.children[pElIndex].children.length - 1;
                    if(pEl.children[pElIndex].children[pTextIndex].text === '') {
                        pEl.children[pElIndex].children[pTextIndex].text = value;
                    } else {
                        pEl.children[pElIndex].children.push(textObj);
                    }
                   
                } else {
                    pEl.children.push(textObj);
                }
            } else if(isList) {
                const listEl = parentEl.children[childrenIndex];
                if(isEmpty(get(listEl, 'children'))) {
                    listEl.children.push({
                        type: 'paragraph',
                        children: [textObj],
                       })
                } else {
                    const listItemChildIndex = listEl.children.length -1 || 0;
                    const lChildEl = listEl.children[listItemChildIndex];
                    const lChildNodeIndex = lChildEl.children.length - 1 || 0;
                    const childNodeEl = lChildEl.children[lChildNodeIndex];
                    if(childNodeEl && _.has(childNodeEl, 'marks') && childNodeEl.text === '') {
                        childNodeEl.text = value;
                    } else if(get(childNodeEl, 'href') && childNodeEl.children[0].text === '') {
                        childNodeEl.children[0].text = value;
                    } else {
                        lChildEl.children.push(textObj);
                    }
                   
                }
               
            } else if(_.has(parentEl.children[childrenIndex], 'marks') && parentEl.children[childrenIndex].marks.length > 0 && parentEl.children[childrenIndex].text === '') {
                parentEl.children[childrenIndex].text = value;
            } else if(_.has(parentEl.children[childrenIndex], 'href') && parentEl.children[childrenIndex].children[0].text === '') {
                parentEl.children[childrenIndex].children[0].text = value;
            } else {
                parentEl.children.push(textObj)
            }
        }
        
    }
    
    function groupAssets(flatAssets) {
        let assets = [];
        let assetsArray = [];
        flatAssets.forEach(data => {
            if(data && data.children && (data.children.length > 0 || _.keys(data.data).length > 0)) {
                assets.push(data);
            } else {
                if(assets.length > 0) {
                    assetsArray.push(assets);
                }
                assets = [];
            }
        })
        return assetsArray;
    }
    
    return {
        element: element,
        text: text,
        groupAssets: groupAssets,
    };
}