import type { PostBlock, PostTextRun } from '@/types/models';

export function textRuns(block: PostBlock): PostTextRun[] {
  return block.runs?.map(run => run.text).join('') === (block.content ?? '')
    ? block.runs! : [{ text: block.content ?? '', fontSize: block.fontSize ?? (block.type === 'heading' ? 20 : 15), bold: block.bold ?? block.type === 'heading', align: block.align ?? 'left' }];
}
const escape = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
export function textHTML(block: PostBlock) {
  if (!block.content) return '';
  return textLines(block).map(line => `<div style="text-align:${line.align}">${line.runs.map(run => `<span style="font-size:${run.fontSize ?? block.fontSize ?? (block.type === 'heading' ? 20 : 15)}px;font-weight:${run.bold ? 700 : 400};font-style:${run.italic ? 'italic' : 'normal'};text-decoration:${run.underline ? 'underline' : 'none'};font-family:${run.fontFamily === 'serif' ? 'NailySerif,serif' : run.fontFamily === 'monospace' ? 'monospace' : 'Arial,sans-serif'};color:${escape(run.color ?? '#383438')};background-color:${escape(run.backgroundColor ?? 'transparent')}">${escape(run.text)}</span>`).join('') || '<br>'}</div>`).join('');
}
export function textLines(block: PostBlock) {
  const lines: { runs: PostTextRun[]; align: string }[] = [{ runs: [], align: block.align ?? 'left' }];
  for (const run of textRuns(block)) {
    run.text.split('\n').forEach((text, index) => {
      if (index) lines.push({ runs: [], align: run.align ?? block.align ?? 'left' });
      const line = lines[lines.length - 1];
      line.align = run.align ?? block.align ?? 'left';
      if (text) line.runs.push({ ...run, text });
    });
  }
  return lines;
}

/** Merge old adjacent text sections without losing their authored formatting. */
export function continuousBlocks(blocks: PostBlock[]): PostBlock[] {
  const result: PostBlock[] = [];
  for (const block of blocks) {
    const previous = result[result.length - 1];
    if (previous && ['text', 'heading'].includes(previous.type) && ['text', 'heading'].includes(block.type)) {
      const previousRuns = textRuns(previous);
      const runs = [...previousRuns, { ...previousRuns[previousRuns.length - 1], text: '\n' }, ...textRuns(block)];
      result[result.length - 1] = { ...previous, type: 'text', content: runs.map(run => run.text).join(''), runs };
    } else result.push(block);
  }
  return result;
}

export function richDocument(block: PostBlock) {
  // All initial markup is generated from escaped text; raw post HTML is never loaded.
  return `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1"><style>
html,body{margin:0;padding:0;overflow:hidden;background:transparent}#editor{outline:none;white-space:pre-wrap;overflow-wrap:anywhere;min-height:44px;font:15px/1.5 -apple-system,BlinkMacSystemFont,Arial,sans-serif;color:#383438;text-align:${block.align ?? 'left'}}#editor font[size="7"]{font-size:var(--pending-size,15px)}#editor:empty:before{content:'내용을 입력하세요';color:#a8a1a3;pointer-events:none}</style></head><body><div id="editor" contenteditable="true" role="textbox" aria-label="본문" aria-multiline="true">${textHTML(block)}</div><script>
const editor=document.getElementById('editor');let saved=null,composing=false,queued=null,pendingSize=15,currentRuns=[],currentFormat={},fontsReady=false;
const send=data=>{const message=JSON.stringify(data);if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(message);else parent.postMessage(message,'*')};
function selection(){const s=getSelection();if(s.rangeCount&&editor.contains(s.anchorNode)){saved=s.getRangeAt(0).cloneRange();return s}return null}
function report(change=false){
 const runs=[];let structural=false;
 function effective(element){const style=getComputedStyle(element);let background=style.backgroundColor,underline=style.textDecorationLine.includes('underline');for(let parent=element.parentElement;parent&&editor.contains(parent);parent=parent.parentElement){const inherited=getComputedStyle(parent);underline=underline||inherited.textDecorationLine.includes('underline');if(background==='transparent'||background==='rgba(0, 0, 0, 0)')background=inherited.backgroundColor}return {fontSize:style.fontSize,fontWeight:style.fontWeight,fontStyle:style.fontStyle,textDecorationLine:underline?'underline':'none',fontFamily:style.fontFamily,color:style.color,backgroundColor:background,textAlign:style.textAlign}}
 function family(style){const name=style.fontFamily.toLowerCase().replace(/["']/g,'');return name.includes('monospace')?'monospace':(name.includes('nailyserif')||name==='serif')?'serif':'system'}
 function append(text,style){if(!text)return;const run={text,fontSize:parseFloat(style.fontSize)||15,bold:parseInt(style.fontWeight)>=600,italic:style.fontStyle==='italic',underline:style.textDecorationLine.includes('underline'),fontFamily:family(style),color:style.color,backgroundColor:style.backgroundColor,align:style.textAlign};const last=runs[runs.length-1];if(last&&Object.keys(run).every(key=>key==='text'||last[key]===run[key]))last.text+=text;else runs.push(run)}
 function walk(node){if(node.nodeType===3){append(node.parentElement.closest('[data-typing]')?node.nodeValue.replace(/^\u200b/,''):node.nodeValue,effective(node.parentElement));structural=false;return}if(node.nodeType!==1)return;
 const block=node!==editor&&/^(DIV|P|LI)$/.test(node.tagName);if(block&&runs.length&&!runs[runs.length-1].text.endsWith('\\n'))append('\\n',getComputedStyle(node));
 if(node.tagName==='BR'){if(node.parentElement.childNodes.length!==1)append('\\n',getComputedStyle(node));structural=false;return}for(const child of node.childNodes)walk(child);
 if(block){append('\\n',getComputedStyle(node));structural=true}}
 walk(editor);if(structural&&runs.length){runs[runs.length-1].text=runs[runs.length-1].text.slice(0,-1);if(!runs[runs.length-1].text)runs.pop()}
 const s=selection();let caret=null,style=null;if(s){const range=s.getRangeAt(0).cloneRange();range.collapse(false);const node=s.focusNode;const element=node.nodeType===1?node:node.parentElement;let rect=range.getClientRects()[0];if(!rect){const child=node.nodeType===1?node.childNodes[Math.min(s.focusOffset,node.childNodes.length-1)]:null;rect=(child&&child.nodeType===1?child:element).getBoundingClientRect()}const origin=editor.getBoundingClientRect().top;if(rect)caret={top:rect.top-origin,bottom:rect.bottom-origin};style=effective(element)}
 const offset=s?textOffset(s.focusNode,s.focusOffset):undefined;
 const state={type:'state',fontsReady,change,runs,content:runs.map(r=>r.text).join(''),height:Math.ceil(editor.getBoundingClientRect().height)+4,caret,offset,focused:document.activeElement===editor,bold:document.queryCommandState('bold'),italic:document.queryCommandState('italic'),underline:document.queryCommandState('underline'),fontFamily:family({fontFamily:document.queryCommandValue('fontName')||(style?style.fontFamily:'Arial')}),color:document.queryCommandValue('foreColor')||(style?style.color:'#383438'),backgroundColor:style?style.backgroundColor:'transparent',size:document.queryCommandValue('fontSize')==='7'?pendingSize:(style?parseFloat(style.fontSize):15),align:style?style.textAlign:getComputedStyle(editor).textAlign};
 currentRuns=runs;currentFormat={fontSize:state.size,bold:state.bold,italic:state.italic,underline:state.underline,fontFamily:state.fontFamily,color:state.color,backgroundColor:state.backgroundColor,align:state.align};send(state);
}
function textOffset(node,offset){const prefix=document.createRange();prefix.selectNodeContents(editor);prefix.setEnd(node,offset);let text='',ending=false;function read(node){if(node.nodeType===3){text+=node.parentElement&&node.parentElement.closest('[data-typing]')?node.nodeValue.replace(/^\u200b/,''):node.nodeValue;ending=false;return}const block=/^(DIV|P|LI)$/.test(node.nodeName);if(block&&text&&!text.endsWith('\\n'))text+='\\n';if(node.nodeName==='BR'){if(node.parentNode.childNodes.length!==1)text+='\\n';ending=false;return}for(const child of node.childNodes)read(child);if(block){text+='\\n';ending=true}}read(prefix.cloneContents());return ending?text.length-1:text.length}
function installRuns(runs,start,end){
 const fragment=document.createDocumentFragment(),records=[],lines=[];let line=document.createElement('div'),position=0,typing=null;fragment.appendChild(line);lines.push({node:line,start:0});
 for(const run of runs){const parts=run.text.split('\\n');for(let i=0;i<parts.length;i++){if(!line.childNodes.length)line.style.textAlign=run.align||'left';if(parts[i]){const span=document.createElement('span');Object.assign(span.style,{fontSize:(run.fontSize||15)+'px',fontWeight:run.bold?'700':'400',fontStyle:run.italic?'italic':'normal',textDecoration:run.underline?'underline':'none',fontFamily:run.fontFamily==='serif'?'NailySerif,serif':run.fontFamily==='monospace'?'monospace':'Arial,sans-serif',color:run.color||'#383438',backgroundColor:run.backgroundColor||'transparent'});span.textContent=parts[i];line.appendChild(span);if(run.typing){span.dataset.typing='true';typing=span}else{records.push({node:span.firstChild,start:position,length:parts[i].length});position+=parts[i].length}}if(i<parts.length-1){position++;line=document.createElement('div');fragment.appendChild(line);lines.push({node:line,start:position})}}}
 for(const item of lines)if(!item.node.childNodes.length){item.node.appendChild(document.createElement('br'));records.push({node:item.node,start:item.start,length:0})}
 editor.replaceChildren(fragment);records.sort((a,b)=>a.start-b.start);const at=offset=>{const hit=records.find(item=>offset>=item.start&&offset<=item.start+item.length);return hit?{node:hit.node,offset:offset-hit.start}:{node:line,offset:line.childNodes.length}};
 const range=document.createRange();if(typing){range.setStart(typing.firstChild,1);range.collapse(true)}else{const a=at(start),b=at(end);range.setStart(a.node,a.offset);range.setEnd(b.node,b.offset)}const s=getSelection();s.removeAllRanges();s.addRange(range);saved=range.cloneRange();
}
function recolorBackground(runs,format,start,end,value){const next=[];let position=0,inserted=false;
 for(const run of runs){const a=Math.max(0,Math.min(run.text.length,start-position)),b=Math.max(0,Math.min(run.text.length,end-position));if(start===end&&!inserted&&start>=position&&start<=position+run.text.length){if(a)next.push({...run,text:run.text.slice(0,a)});next.push({...format,text:'\u200b',backgroundColor:value,typing:true});if(a<run.text.length)next.push({...run,text:run.text.slice(a)});inserted=true}else if(b>a){if(a)next.push({...run,text:run.text.slice(0,a)});next.push({...run,text:run.text.slice(a,b),backgroundColor:value});if(b<run.text.length)next.push({...run,text:run.text.slice(b)})}else next.push(run);position+=run.text.length}
 if(start===end&&!inserted)next.push({...format,text:'\u200b',backgroundColor:value,typing:true});return next;
}
function background(value){report();const s=selection();if(!s)return;const range=s.getRangeAt(0),start=textOffset(range.startContainer,range.startOffset),end=textOffset(range.endContainer,range.endOffset);installRuns(recolorBackground(currentRuns,currentFormat,start,end,value),start,end);
}
function normalizeTyping(){editor.querySelectorAll('[data-typing]').forEach(span=>{const node=document.createTreeWalker(span,NodeFilter.SHOW_TEXT).nextNode();if(node&&node.nodeValue.startsWith('\u200b'))node.deleteData(0,1);span.removeAttribute('data-typing')})}
function normalizeSize(){editor.querySelectorAll('font[size="7"]').forEach(node=>{node.removeAttribute('size');node.style.fontSize=pendingSize+'px'})}
function command(data){
 if(data.kind==='fonts'){let face=document.getElementById('editor-fonts');if(!face){face=document.createElement('style');face.id='editor-fonts';document.head.appendChild(face)}face.textContent=data.value;Promise.all([document.fonts.load('400 15px NailySerif'),document.fonts.load('700 15px NailySerif')]).then(loaded=>{fontsReady=loaded.every(fonts=>fonts.length>0);report()}).catch(()=>{fontsReady=false;report()});return;}
 if(data.kind==='locate'){const x=Math.max(0,Math.min(editor.clientWidth-1,data.x)),y=Math.max(0,Math.min(editor.clientHeight-1,data.y));const position=document.caretPositionFromPoint?document.caretPositionFromPoint(x,y):null;const hit=position?document.createRange():document.caretRangeFromPoint?document.caretRangeFromPoint(x,y):null;if(position){hit.setStart(position.offsetNode,position.offset);hit.collapse(true)}if(!hit||!editor.contains(hit.startContainer)){send({type:'drop',query:data.query});return}const rect=hit.getClientRects()[0];send({type:'drop',query:data.query,offset:textOffset(hit.startContainer,hit.startOffset),top:rect?rect.top-editor.getBoundingClientRect().top:0,left:rect?rect.left-editor.getBoundingClientRect().left:0,height:rect?rect.height:22});return}
 if(data.kind==='disabled'){editor.contentEditable=data.value?'false':'true';return}if(composing){queued=data;return}
 selection();const restore=saved&&saved.cloneRange();editor.focus({preventScroll:true});if(restore){const s=getSelection();s.removeAllRanges();s.addRange(restore);saved=restore.cloneRange()}
 if(data.kind==='bold')document.execCommand('bold');
 if(data.kind==='italic'||data.kind==='underline')document.execCommand(data.kind);
 if(data.kind==='fontFamily')document.execCommand('fontName',false,data.value==='system'?'Arial':data.value==='serif'?'NailySerif':data.value);
 if(data.kind==='color')document.execCommand('foreColor',false,data.value);
 if(data.kind==='backgroundColor')background(data.value);
 if(data.kind==='size'){pendingSize=data.value;editor.style.setProperty('--pending-size',data.value+'px');document.execCommand('fontSize',false,'7');normalizeSize()}
 if(data.kind==='align')document.execCommand(data.value==='right'?'justifyRight':data.value==='center'?'justifyCenter':'justifyLeft');
 selection();report(data.kind!=='focus');}
window.editorCommand=command;window.addEventListener('message',event=>{try{command(JSON.parse(event.data))}catch{}});
editor.addEventListener('input',()=>{if(!composing){normalizeTyping();normalizeSize()}report(true)});editor.addEventListener('focus',()=>report());
editor.addEventListener('blur',()=>report());
editor.addEventListener('compositionstart',()=>composing=true);editor.addEventListener('compositionend',()=>{composing=false;normalizeTyping();normalizeSize();report(true);if(queued){const data=queued;queued=null;command(data)}});
document.addEventListener('selectionchange',()=>{if(document.activeElement===editor)report()});
editor.addEventListener('paste',event=>{event.preventDefault();document.execCommand('insertText',false,event.clipboardData.getData('text/plain'))});
new ResizeObserver(()=>report()).observe(editor);window.addEventListener('resize',()=>report());report();
</script></body></html>`;
}
