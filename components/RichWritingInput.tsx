import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Platform, View } from 'react-native';
import type { PostBlock, PostTextRun, TextAlign } from '@/types/models';
import { richDocument } from '@/services/richWriting';
import { editorFontCSS } from '@/services/editorFonts';

export type RichCommand = 'bold' | 'italic' | 'underline' | 'size' | 'align' | 'fontFamily' | 'color' | 'backgroundColor';
export type TextHit = { offset: number; top: number; left?: number; height?: number };
export type RichInputHandle = { focus: () => void; command: (kind: RichCommand, value?: number | string) => void; locate: (x: number, y: number) => Promise<TextHit | null> };
export type RichInputState = { type: 'state'; change: boolean; content: string; runs: PostTextRun[]; height: number; caret: { top: number; bottom: number } | null; focused: boolean; bold: boolean; italic: boolean; underline: boolean; fontFamily: 'system' | 'serif' | 'monospace'; color: string; backgroundColor: string; size: number; align: TextAlign; offset?: number; fontsReady?: boolean };
type Props = { block: PostBlock; disabled?: boolean; onState: (state: RichInputState) => void };

export default forwardRef<RichInputHandle, Props>(function RichWritingInput({ block, disabled, onState }, ref) {
  const [height, setHeight] = useState(48);
  const html = useRef(richDocument(block)).current;
  const source = useRef({ html }).current;
  const web = useRef<HTMLIFrameElement>(null);
  const native = useRef<{ injectJavaScript: (script: string) => void } | null>(null);
  const ready = useRef(false);
  const queued = useRef<{ kind: string; value?: number | string | boolean }[]>([]);
  const requests = useRef(new Map<number, (hit: TextHit | null) => void>());
  const sequence = useRef(0);
  const latest = useRef(onState); latest.current = onState;
  const receive = (message: string) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'drop') { requests.current.get(data.query)?.(Number.isFinite(data.offset) ? { offset: data.offset, top: data.top, left: data.left, height: data.height } : null); requests.current.delete(data.query); return; }
      const state = data as RichInputState;
      if (state.type !== 'state' || !Number.isFinite(state.height) || !Array.isArray(state.runs)) return;
      setHeight(Math.max(48, state.height)); latest.current(state);
    } catch { /* Ignore unrelated frame messages. */ }
  };
  const command = (kind: string, value?: number | string | boolean) => {
    if (!ready.current) { queued.current.push({ kind, value }); return; }
    const data = JSON.stringify({ kind, value });
    if (Platform.OS === 'web') web.current?.contentWindow?.postMessage(data, '*');
    else native.current?.injectJavaScript(`window.editorCommand(${data});true;`);
  };
  const loaded = () => { ready.current = true; command('disabled', Boolean(disabled)); const commands = queued.current; queued.current = []; for (const item of commands) command(item.kind, item.value); };
  useImperativeHandle(ref, () => ({ focus: () => command('focus'), command, locate: (x, y) => new Promise(resolve => {
    if (!ready.current) { resolve(null); return; }
    const query = ++sequence.current;
    const timer = setTimeout(() => { requests.current.delete(query); resolve(null); }, 400);
    requests.current.set(query, hit => { clearTimeout(timer); resolve(hit); });
    const data = JSON.stringify({ kind: 'locate', x, y, query });
    if (Platform.OS === 'web') web.current?.contentWindow?.postMessage(data, '*');
    else native.current?.injectJavaScript(`window.editorCommand(${data});true;`);
  }) }));
  useEffect(() => () => { for (const resolve of requests.current.values()) resolve(null); requests.current.clear(); }, []);
  useEffect(() => { command('disabled', Boolean(disabled)); }, [disabled]);
  useEffect(() => { let mounted = true; void editorFontCSS().then(css => { if (mounted) command('fonts', css); }).catch(() => {}); return () => { mounted = false; }; }, []);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const listener = (event: MessageEvent) => { if (event.source === web.current?.contentWindow && typeof event.data === 'string') receive(event.data); };
    window.addEventListener('message', listener); return () => window.removeEventListener('message', listener);
  }, []);
  if (Platform.OS === 'web') return createElement('iframe', { ref: web, srcDoc: html, title: '본문 편집', sandbox: 'allow-scripts allow-same-origin', onLoad: loaded, style: { border: 0, width: '100%', height, display: 'block', pointerEvents: disabled ? 'none' : 'auto' } });
  const WebView = require('react-native-webview').WebView;
  return <View style={{ height }}><WebView ref={native} source={source} originWhitelist={['about:blank']} scrollEnabled={false} bounces={false} automaticallyAdjustContentInsets={false} hideKeyboardAccessoryView keyboardDisplayRequiresUserAction={false} onLoadEnd={loaded} onShouldStartLoadWithRequest={(request: { url: string }) => request.url === 'about:blank'} onMessage={(event: { nativeEvent: { data: string } }) => receive(event.nativeEvent.data)} style={{ backgroundColor: 'transparent' }} /></View>;
});
