import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { COZE_CONFIG } from '../config.js';
import { loadProfile } from '../lib/storage.js';

const XIAOYI_AVATAR = 'https://api.dicebear.com/7.x/notionists/svg?seed=Xiaoyi&backgroundColor=ffdfbf';
const USER_AVATAR = 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=d1fae5';
const XIAOYI_TAGS = ['INFP', '双子座', '武汉', '铲屎官', '社恐'];

const EASTER_EGG_KEYWORDS = ["ฅ'ω'ฅ", '胖橘', '猫'];
const EASTER_EGG_DURATION_MS = 2800;

function generateUserId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return `user_${Date.now()}_${Math.random().toString(36).slice(2, 15)}`;
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function checkEasterEgg(text) {
  return EASTER_EGG_KEYWORDS.some((kw) => text && text.includes(kw));
}

function extractNarrations(text) {
  if (!text) return { cleaned: '', narrations: [] };
  const narrations = [];
  const cleaned = String(text).replace(/【旁白：([\s\S]*?)】/g, (_, p1) => {
    const t = String(p1 ?? '').trim();
    if (t) narrations.push(t);
    return '';
  }).trim();
  return { cleaned, narrations };
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function pickWhisperAdvice(profile, narrationTriggered) {
  if (narrationTriggered) return '刚刚的旁白提醒像是在说：把距离感再拿捏得柔和一点～下次先多共情，再轻轻推进。';
  const hobbies = profile?.hobbies ?? [];
  const personality = profile?.personality ?? [];
  if (hobbies.includes('萌宠陪伴')) return '她看起来会被萌宠话题软化情绪，下次从“你家小动物最近有没有新技能”切入很自然～';
  if (hobbies.includes('咖啡品鉴')) return '用一杯咖啡打开话题最不冒犯：你可以问她最近最喜欢的口味或店～';
  if (personality.includes('慢热温和')) return '慢热的人更吃“轻轻的持续”：别急着要答案，给她舒服的节奏。';
  if (personality.includes('理性思考')) return '理性型更在意逻辑和细节：用一个具体场景表达感受，会更容易共鸣。';
  return '你已经开了个好头啦～下次可以用一句轻松的小反问，把对话自然延续下去。';
}

export default function ChatPage() {
  const nav = useNavigate();
  const profile = useMemo(() => loadProfile(), []);

  const [userId] = useState(() => generateUserId());
  const [messages, setMessages] = useState([
    { id: 'init', kind: 'bubble', role: 'assistant', content: '滴滴，初次见面～' },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [delayedTyping, setDelayedTyping] = useState(false);

  const [countdown, setCountdown] = useState(120);
  const [timeOver, setTimeOver] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [frozenReport, setFrozenReport] = useState(null); // { ice, mood, boundary, danger }
  const [frozenTotal, setFrozenTotal] = useState(null); // { total, danger }

  const [narrationTriggered, setNarrationTriggered] = useState(false);
  const [showEasterEgg, setShowEasterEgg] = useState(false);
  const [offenseCount, setOffenseCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);

  const chatEndRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const delayedTimerRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading, delayedTyping, scrollToBottom]);

  useEffect(() => {
    if (timeOver || isBlocked) return;
    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [timeOver, isBlocked]);

  useEffect(() => {
    if (countdown <= 0 && !timeOver && !isBlocked) {
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setTimeOver(true);
      setShowReportModal(true);
    }
  }, [countdown, timeOver, isBlocked]);

  useEffect(() => {
    return () => {
      if (delayedTimerRef.current) clearTimeout(delayedTimerRef.current);
    };
  }, []);

  const triggerEasterEgg = useCallback(() => {
    setShowEasterEgg(true);
    setTimeout(() => setShowEasterEgg(false), EASTER_EGG_DURATION_MS);
  }, []);

  const triggerBlock = useCallback(() => {
    setIsBlocked((prev) => {
      if (prev) return prev;
      if (countdownTimerRef.current) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setTimeOver(true);
      setMessages((prevMsgs) => [
        ...prevMsgs,
        {
          id: `block_${Date.now()}`,
          kind: 'system',
          content: '对方已将你拉黑，聊天提前终止。',
        },
      ]);
      // 立刻滚动到底部，让用户看到拉黑提示
      scrollToBottom();
      // 2 秒后再弹出结束 Modal，给足阅读时间
      setTimeout(() => {
        setShowReportModal(true);
      }, 2000);
      return true;
    });
  }, [scrollToBottom]);

  const appendAssistantReply = useCallback((rawText) => {
    const { cleaned, narrations } = extractNarrations(rawText);
    if (narrations.length) {
      setNarrationTriggered(true);
      setOffenseCount((prev) => {
        const next = prev + 1;
        if (next >= 2) {
          triggerBlock();
        }
        return next;
      });
      setMessages((prev) => [
        ...prev,
        ...narrations.map((t) => ({
          id: `sys_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          kind: 'system',
          content: t,
        })),
      ]);
    }

    let text = cleaned.trim();
    if (!text) return;
    // 关键修复：去掉开头意外暴露的连续竖线，例如 "||别叫我丫头"
    text = text.replace(/^\|\|+/, '').trim();
    if (!text) return;

    const parts = text.includes('||')
      ? text.split('||')
      : text.includes('\n')
      ? text.split('\n')
      : [text];
    const normalized = parts.map((s) => s.trim()).filter(Boolean);
    if (normalized.length >= 2) {
      const first = normalized[0];
      const second = normalized[1];
      setMessages((prev) => [
        ...prev,
        { id: `bot_${Date.now()}_${Math.random().toString(16).slice(2)}`, kind: 'bubble', role: 'assistant', content: first },
      ]);
      setDelayedTyping(true);
      if (delayedTimerRef.current) clearTimeout(delayedTimerRef.current);
      delayedTimerRef.current = setTimeout(() => {
        setDelayedTyping(false);
        setMessages((prev) => [
          ...prev,
          { id: `bot_${Date.now()}_${Math.random().toString(16).slice(2)}`, kind: 'bubble', role: 'assistant', content: second },
        ]);
      }, 800);
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `bot_${Date.now()}_${Math.random().toString(16).slice(2)}`,
        kind: 'bubble',
        role: 'assistant',
        content: normalized[0] || text,
      },
    ]);
  }, []);

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || loading || timeOver || isBlocked) return;

    const userMsg = { id: `user_${Date.now()}`, kind: 'bubble', role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    setLoading(true);

    const historyForApi = messages
      .filter((m) => m.kind === 'bubble' && (m.role === 'user' || m.role === 'assistant') && m.id !== 'init')
      .map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content),
        content_type: 'text',
      }));
    historyForApi.push({ role: 'user', content: text, content_type: 'text' });

    // 开发环境走 Vite 代理 /api/coze，生产直连 Coze BASE
    const apiBase = import.meta.env.DEV ? '/api/coze' : COZE_CONFIG.BASE;
    const cozeFetch = (path, opts = {}) =>
      fetch(`${apiBase}${path}`, {
        ...opts,
        headers: {
          Authorization: `Bearer ${COZE_CONFIG.PAT}`,
          'Content-Type': 'application/json',
          ...opts.headers,
        },
      });

    const readJson = async (res) => {
      const raw = await res.text();
      if (!res.ok) {
        console.error('Coze API 请求失败', { status: res.status, body: raw });
        throw new Error(`HTTP ${res.status}: ${raw.slice(0, 300)}`);
      }
      try {
        return JSON.parse(raw);
      } catch {
        throw new Error(`响应非 JSON: ${raw.slice(0, 100)}`);
      }
    };

    const getContentText = (msg) => {
      if (!msg) return '';
      const c = msg.content ?? msg.text;
      if (typeof c === 'string') return c.trim();
      if (c?.text) return String(c.text).trim();
      if (Array.isArray(c)) return c.map((p) => p?.text ?? p?.content ?? '').filter(Boolean).join('').trim();
      return '';
    };

    const extractAnswerFromData = (data) => {
      const list = Array.isArray(data?.data)
        ? data.data
        : data?.data?.messages ?? data?.data?.message_list ?? data?.messages ?? data?.message_list ?? [];
      if (!Array.isArray(list) || list.length === 0) return '';
      const answerMessages = list.filter((m) => m && m.type === 'answer' && m.role === 'assistant');
      const lastAnswer = answerMessages[answerMessages.length - 1];
      return getContentText(lastAnswer);
    };

    try {
      const createRes = await cozeFetch('/v3/chat', {
        method: 'POST',
        body: JSON.stringify({
          bot_id: COZE_CONFIG.BOT_ID,
          user_id: userId,
          stream: false,
          additional_messages: historyForApi,
        }),
      });
      const createData = await readJson(createRes);
      if (createData.code != null && Number(createData.code) !== 0) {
        throw new Error(`创建会话失败(code=${createData.code}): ${createData.msg || createData.message || ''}`);
      }

      const createPayload = createData?.data ?? createData;
      const chatId =
        createPayload?.id ??
        createPayload?.chat_id ??
        createPayload?.chat?.id ??
        createData.chat_id ??
        createData.id ??
        createData.data?.id;
      const convId = createPayload?.conversation_id ?? createData.conversation_id ?? createData.data?.conversation_id;

      let replyText = extractAnswerFromData(createData);

      if (!replyText.trim() && chatId) {
        const pollIntervalMs = 1000;
        const pollMaxAttempts = 90;
        let status = '';

        for (let attempt = 0; attempt < pollMaxAttempts; attempt++) {
          const q = new URLSearchParams({ chat_id: String(chatId), bot_id: COZE_CONFIG.BOT_ID });
          if (convId) q.set('conversation_id', String(convId));

          const retrieveRes = await cozeFetch(`/v3/chat/retrieve?${q.toString()}`);
          const retrieveData = await readJson(retrieveRes);
          if (retrieveData.code != null && Number(retrieveData.code) !== 0) {
            throw new Error(`轮询失败: ${retrieveData.msg || retrieveData.message || ''}`);
          }
          const rawStatus = (retrieveData.data?.status ?? retrieveData.status ?? '').toLowerCase();
          status = rawStatus;

          if (status === 'completed') break;
          if (status === 'failed' || status === 'cancelled') throw new Error(`对话未完成: ${status}`);
          await new Promise((r) => setTimeout(r, pollIntervalMs));
        }

        if (status !== 'completed') throw new Error('等待回复超时，请稍后再试');

        const listQ = new URLSearchParams({ chat_id: String(chatId), bot_id: COZE_CONFIG.BOT_ID });
        if (convId) listQ.set('conversation_id', String(convId));

        const listRes = await cozeFetch(`/v3/chat/message/list?${listQ.toString()}`);
        const listData = await readJson(listRes);
        if (listData.code != null && Number(listData.code) !== 0) {
          throw new Error(`获取消息列表失败: ${listData.msg || listData.message || ''}`);
        }

        replyText = extractAnswerFromData(listData);
        if (!replyText.trim()) {
          console.error('[Coze 调试] 消息列表完整返回:', JSON.stringify(listData, null, 2));
          throw new Error('未能从消息列表中解析出助手回复。');
        }
      }

      if (!replyText.trim()) {
        console.error('[Coze 调试] 创建会话完整返回:', JSON.stringify(createData, null, 2));
        throw new Error('未能解析出助手回复。');
      }

      appendAssistantReply(replyText);
      if (checkEasterEgg(replyText)) triggerEasterEgg();
    } catch (err) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : String(err);
      setMessages((prev) => [
        ...prev,
        { id: `err_${Date.now()}`, kind: 'bubble', role: 'assistant', content: `系统报错: ${errMsg}`, isError: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const userMessageCount = useMemo(() => messages.filter((m) => m.kind === 'bubble' && m.role === 'user').length, [messages]);

  useEffect(() => {
    if (!showReportModal || frozenReport || isBlocked) return;
    const rounds = userMessageCount;
    const ice = clamp(60 + rounds * 6, 60, 100);
    const mood = clamp(70 + Math.round((Math.random() - 0.5) * 20), 55, 95);
    const boundary = narrationTriggered ? 20 : clamp(92 + Math.round(Math.random() * 8), 90, 100);
    const danger = narrationTriggered;
    setFrozenReport({ ice, mood, boundary, danger });
  }, [showReportModal, frozenReport, userMessageCount, narrationTriggered, isBlocked]);

  useEffect(() => {
    if (!showReportModal || frozenTotal || isBlocked) return;
    const rounds = userMessageCount;
    if (narrationTriggered) {
      setFrozenTotal({ total: 35 + Math.floor(Math.random() * 15), danger: true }); // < 50
      return;
    }
    if (rounds > 4) {
      setFrozenTotal({ total: 80 + Math.floor(Math.random() * 11), danger: false }); // 80-90
      return;
    }
    setFrozenTotal({ total: clamp(60 + rounds * 4 + Math.floor(Math.random() * 6), 60, 79), danger: false });
  }, [showReportModal, frozenTotal, userMessageCount, narrationTriggered, isBlocked]);

  const resetSession = useCallback(() => {
    // stop timers
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    if (delayedTimerRef.current) {
      clearTimeout(delayedTimerRef.current);
      delayedTimerRef.current = null;
    }

    // reset core states
    setMessages([{ id: 'init', kind: 'bubble', role: 'assistant', content: '滴滴，初次见面～' }]);
    setInputValue('');
    setLoading(false);
    setDelayedTyping(false);

    setCountdown(120);
    setTimeOver(false);
    setShowReportModal(false);

    setFrozenReport(null);
    setFrozenTotal(null);

    setNarrationTriggered(false);
    setOffenseCount(0);
    setIsBlocked(false);

    scrollToBottom();
  }, [scrollToBottom]);

  const handleAgain = () => resetSession();

  return (
    <div className="h-[100dvh] bg-brand-bg text-brand-text">
      <div className="h-[100dvh] w-full flex flex-col bg-brand-bg sm:max-w-md sm:mx-auto sm:my-4 sm:h-[calc(100dvh-2rem)] sm:rounded-2xl sm:shadow-xl sm:overflow-hidden sm:border sm:border-brand-primary/55">
        <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-brand-bg border-b border-brand-primary/55 pt-[max(0.75rem,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={() => nav('/')}
            className="flex-1 text-left text-sm text-brand-muted hover:text-brand-text"
          >
            ← 返回定制
          </button>
          <div className="flex-1 text-center">
            <div className="text-brand-text font-semibold text-lg leading-tight">小艺</div>
            <div className="mt-1 flex flex-wrap justify-center gap-1.5">
              {XIAOYI_TAGS.map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full text-[10px] leading-none bg-white border border-brand-primary/50 text-brand-muted"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex-1 flex justify-end items-center gap-1">
            <span className="text-brand-muted text-xl" aria-hidden>⏳</span>
            <span className={`font-mono font-bold text-lg ${countdown <= 30 ? 'text-red-500 animate-pulse' : 'text-brand-text'}`}>
              {formatTime(countdown)}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 pb-5 space-y-3 scroll-smooth">
          {messages.map((msg) => {
            if (msg.kind === 'system') {
              return (
                <div key={msg.id} className="py-1">
                  <div className="text-center text-[12px] text-gray-400">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <img
                  src={msg.role === 'user' ? USER_AVATAR : XIAOYI_AVATAR}
                  alt={msg.role === 'user' ? '我' : '小艺'}
                  className="w-9 h-9 rounded-full flex-shrink-0 object-cover"
                />
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                    msg.isError
                      ? 'bg-red-50 border border-red-200 rounded-tl-sm shadow-sm'
                      : msg.role === 'user'
                      ? 'bg-emerald-100 text-brand-text rounded-tr-sm'
                      : 'bg-white text-brand-text border border-gray-100 rounded-tl-sm shadow-sm'
                  }`}
                >
                  <p className={`text-[15px] leading-relaxed break-words whitespace-pre-wrap ${msg.isError ? 'text-red-600 font-medium' : ''}`}>
                    {msg.content}
                  </p>
                </div>
              </div>
            );
          })}

          {(loading || delayedTyping) && (
            <TypingRow />
          )}
          <div ref={chatEndRef} />
        </main>

        <footer className="flex-shrink-0 sticky bottom-0 p-3 bg-brand-bg border-t border-brand-primary/55 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder={isBlocked ? '对方已开启了好友验证...' : timeOver ? '本局已结束～' : '说点什么...'}
              disabled={timeOver || isBlocked}
              className="flex-1 rounded-full border border-brand-primary/60 bg-white px-4 py-2.5 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/70 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={loading || delayedTyping || timeOver || isBlocked || !inputValue.trim()}
              className="rounded-full bg-brand-primary text-brand-text px-5 py-2.5 font-semibold disabled:opacity-50 disabled:cursor-not-allowed active:opacity-90"
            >
              发送
            </button>
          </div>
        </footer>
      </div>

      {showEasterEgg && (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9998] easter-egg-overlay" aria-hidden>
          <div className="absolute inset-0 bg-pink-200/20" />
          {[...Array(16)].map((_, i) => (
            <span
              key={i}
              className="heart-float text-2xl"
              style={{
                position: 'fixed',
                left: `${10 + (i % 5) * 22}%`,
                top: '-10%',
                animationDelay: `${i * 0.12}s`,
              }}
            >
              {i % 3 === 0 ? '✨' : '❤️'}
            </span>
          ))}
        </div>
      )}

      {showReportModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
          {isBlocked ? (
            <div className="bg-brand-bg rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-red-300">
              <div className="px-6 pt-6 pb-4 text-center">
                <h2 className="text-lg font-extrabold text-red-500 tracking-tight">🛑 演习提前终止</h2>
              </div>
              <div className="px-6 pb-5">
                <div className="rounded-3xl bg-white border border-red-200 px-5 py-6 text-center">
                  <div className="text-2xl font-extrabold text-red-600">你已被对方拉黑</div>
                </div>
                <div className="mt-4 rounded-2xl bg-white border border-red-100 px-4 py-4">
                  <p className="text-sm text-brand-muted leading-relaxed text-center">
                    社交的本质是尊重与平视。连环追问、爹味说教或缺乏边界感的言论，在现实中也会让你错失良缘。请调整心态，下次再试吧！
                  </p>
                </div>
              </div>
              <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => nav('/')}
                  className="rounded-2xl border border-red-200 bg-white py-3 text-brand-text font-medium hover:bg-white/70 active:opacity-95"
                >
                  回到定制
                </button>
                <button
                  type="button"
                  onClick={handleAgain}
                  className="rounded-2xl bg-red-500 text-white py-3 font-semibold shadow-lg active:opacity-95"
                >
                  再来一局
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-brand-bg rounded-3xl shadow-2xl max-w-sm w-full overflow-hidden border border-brand-primary/70">
              <div className="px-6 pt-6 pb-4 text-center">
                <h2 className="text-lg font-extrabold text-brand-primary tracking-tight">专属破冰报告</h2>
              </div>

              <div className="px-6 pb-5">
                <div className={`rounded-3xl bg-white border ${frozenTotal?.danger ? 'border-red-200' : 'border-brand-primary/50'} px-5 py-6 text-center`}>
                  <div className={`text-5xl font-extrabold tracking-tight ${frozenTotal?.danger ? 'text-red-500' : 'text-brand-text'}`}>
                    💖 {frozenTotal?.total ?? 60}
                  </div>
                  <div className="mt-2 text-sm text-brand-muted">
                    {frozenTotal?.danger ? '注意：本局触发了边界提醒' : '表现不错，继续保持这种节奏'}
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white border border-brand-primary/40 px-4 py-4">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <MiniScore label="破冰" value={frozenReport?.ice ?? 60} />
                    <MiniScore label="情绪" value={frozenReport?.mood ?? 70} />
                    <MiniScore label="边界" value={frozenReport?.boundary ?? 90} danger={Boolean(frozenReport?.danger)} />
                  </div>
                </div>

                <div className="mt-4 rounded-2xl bg-white border border-brand-primary/40 px-4 py-4">
                  <div className="text-sm font-semibold text-brand-text">AI 悄悄话</div>
                  <p className="mt-2 text-sm text-brand-muted leading-relaxed">
                    {pickWhisperAdvice(profile, narrationTriggered)}
                  </p>
                </div>
              </div>

              <div className="px-6 pb-6 grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => nav('/')}
                  className="rounded-2xl border border-brand-primary/60 bg-white py-3 text-brand-text font-medium hover:bg-white/70 active:opacity-95"
                >
                  回到定制
                </button>
                <button
                  type="button"
                  onClick={handleAgain}
                  className="rounded-2xl bg-brand-primary text-brand-text py-3 font-semibold shadow-lg active:opacity-95"
                >
                  再来一局
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniScore({ label, value, danger }) {
  const v = clamp(Number(value) || 0, 0, 100);
  return (
    <div className="py-1">
      <div className="text-[11px] text-brand-muted">{label}</div>
      <div className={`mt-1 text-lg font-bold ${danger ? 'text-red-500' : 'text-brand-text'}`}>{v}</div>
    </div>
  );
}

function TypingRow() {
  return (
    <div className="flex gap-2">
      <img src={XIAOYI_AVATAR} alt="小艺" className="w-9 h-9 rounded-full flex-shrink-0 object-cover" />
      <div className="rounded-2xl rounded-tl-sm px-4 py-2.5 bg-white border border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-[15px] text-brand-muted">对方正在输入...</span>
          <span className="inline-flex items-center gap-1" aria-hidden>
            <Dot />
            <Dot delay="150ms" />
            <Dot delay="300ms" />
          </span>
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-brand-muted/60 animate-bounce"
      style={{ animationDelay: delay ?? '0ms' }}
    />
  );
}

