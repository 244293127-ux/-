import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast.jsx';
import { clearDraft, clearProfile, clearTags, loadDraft, saveDraft, saveProfile } from '../lib/storage.js';

const BASIC_OPTIONS = {
  mbti: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'],
  zodiac: ['白羊', '金牛', '双子', '巨蟹', '狮子', '处女', '天秤', '天蝎', '射手', '摩羯', '水瓶', '双鱼'],
  city: ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '西安', '重庆', '苏州', '厦门', '其他'],
  age: ['18-22', '23-26', '27-30', '31-35', '35+'],
};

const HOBBIES = [
  '摄影记录生活', '看展与话剧', '独立音乐', '沉浸式阅读', '写作与表达', '咖啡品鉴', '探店打卡', '烹饪美食', '萌宠陪伴', '麦霸/爱唱K',
  '主机游戏', '追剧看影', '徒步露营', '瑜伽冥想', '城市夜跑', '健身自律',
];

const PERSONALITY = [
  '慢热温和', '独处爱好者', '理性思考', '倾听者', '气氛担当', '热情开朗', '表达欲旺盛', '边界感强',
  '共情力高', '细节控', '随性自由', '情绪稳定',
];

const LOVE_PREF = [
  '精神共鸣', '智性恋', '审美契合', '高情绪价值', '共同成长', '偏爱倾听者', '细水长流', '势均力敌',
  '反感说教', '看重真诚度', '拒绝冷暴力',
];

function Pill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'px-3.5 py-2 rounded-full text-[13px] sm:text-sm border transition',
        'active:scale-[0.99] select-none',
        active
          ? 'bg-brand-primary text-brand-text border-brand-primary shadow-sm'
          : 'bg-white/80 text-brand-text border-gray-200 hover:border-brand-primary/70 hover:bg-white',
      ].join(' ')}
    >
      {children}
    </button>
  );
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-brand-primary/45 bg-white/80 shadow-sm">
      <div className="px-5 pt-5 pb-3">
        <h2 className="text-[15px] font-semibold text-brand-text">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-brand-muted leading-relaxed">{subtitle}</p>}
      </div>
      <div className="px-5 pb-5">{children}</div>
    </section>
  );
}

function toggleInArray(arr, value) {
  return arr.includes(value) ? arr.filter((x) => x !== value) : [...arr, value];
}

function uniq(arr) {
  const s = new Set();
  const out = [];
  for (const x of arr) {
    const v = String(x ?? '').trim();
    if (!v) continue;
    if (s.has(v)) continue;
    s.add(v);
    out.push(v);
  }
  return out;
}

function buildTagPayload({ basic, socialMode, school, work, hobbies, personality, love }) {
  const primary = uniq([
    ...(basic.mbti ?? []),
    ...(basic.zodiac ?? []).map((z) => `${z}座`),
    ...(basic.city ?? []).map((c) => (c === '其他' ? '其他城市' : c)),
    ...(basic.age ?? []).map((a) => `年龄${a}`),
  ]);

  const social = [];
  if (socialMode === 'school') {
    social.push('还在上学');
    if (school?.degree) social.push(school.degree);
    if (school?.major) social.push(school.major);
  }
  if (socialMode === 'work') {
    social.push('已经工作');
    if (work?.industry) social.push(work.industry);
  }

  const allTags = uniq([
    ...primary,
    ...social,
    ...(hobbies ?? []),
    ...(personality ?? []),
    ...(love ?? []),
  ]);

  // 核心标签：优先基础标签，再补 1-2 个性格/兴趣
  const core = [];
  const pushSome = (list, maxTake) => {
    for (const t of list) {
      if (core.length >= 4) return;
      if (!core.includes(t)) core.push(t);
      if (maxTake != null && core.length >= maxTake) return;
    }
  };
  pushSome(primary, 4);
  if (core.length < 3) pushSome(personality ?? [], 4);
  if (core.length < 3) pushSome(hobbies ?? [], 4);
  if (core.length < 3) pushSome(love ?? [], 4);
  if (core.length < 3) pushSome(social, 4);

  return { allTags, coreTags: core.slice(0, 4) };
}

export default function CustomizeAvatar() {
  const nav = useNavigate();
  const toast = useToast();

  const [basic, setBasic] = useState({ mbti: [], zodiac: [], city: [], age: [] });
  const [socialMode, setSocialMode] = useState(null); // 'school' | 'work' | null
  const [school, setSchool] = useState({ degree: '', university: '', major: '' });
  const [work, setWork] = useState({ industry: '' });
  const [hobbies, setHobbies] = useState([]);
  const [personality, setPersonality] = useState([]);
  const [love, setLove] = useState([]);
  const [transitionOpen, setTransitionOpen] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    setBasic(draft.basic ?? { mbti: [], zodiac: [], city: [], age: [] });
    setSocialMode(draft.socialMode ?? null);
    setSchool(draft.school ?? { degree: '', university: '', major: '' });
    setWork(draft.work ?? { industry: '' });
    setHobbies(draft.hobbies ?? []);
    setPersonality(draft.personality ?? []);
    setLove(draft.love ?? []);
  }, []);

  useEffect(() => {
    saveDraft({ basic, socialMode, school, work, hobbies, personality, love, updatedAt: Date.now() });
  }, [basic, socialMode, school, work, hobbies, personality, love]);

  const selectedBoardCount = useMemo(() => {
    let n = 0;
    const basicCount = basic.mbti.length + basic.zodiac.length + basic.city.length + basic.age.length;
    if (basicCount > 0) n += 1;
    if (socialMode) n += 1;
    if (hobbies.length > 0) n += 1;
    if (personality.length > 0) n += 1;
    if (love.length > 0) n += 1;
    return n;
  }, [basic, socialMode, hobbies, personality, love]);

  const validate = () => {
    const errors = [];
    if (selectedBoardCount < 3) {
      errors.push('请最少选择 3 个板块，每个板块至少选 1 个标签。');
    }
    if (socialMode === 'school') {
      // 输入不强制，但希望“至少选择了该板块”的语义明确
    }
    if (socialMode === 'work') {
      // 同上
    }
    return errors;
  };

  const handleGenerate = () => {
    const errs = validate();
    if (errs.length) {
      toast.show(errs[0]);
      return;
    }

    const profile = {
      basic,
      social: socialMode
        ? {
            mode: socialMode,
            ...(socialMode === 'school' ? { school } : { work }),
          }
        : null,
      hobbies,
      personality,
      love,
      createdAt: Date.now(),
      version: 1,
    };
    saveProfile(profile);

    setTransitionOpen(true);
  };

  const handleReset = () => {
    setTransitionOpen(false);
    clearDraft();
    clearProfile();
    clearTags();
    setBasic({ mbti: [], zodiac: [], city: [], age: [] });
    setSocialMode(null);
    setSchool({ degree: '', university: '', major: '' });
    setWork({ industry: '' });
    setHobbies([]);
    setPersonality([]);
    setLove([]);
    toast.show('已为你清空选择，重新开始吧～');
  };

  const enterAsPursuer = () => {
    setTransitionOpen(false);
    nav('/chat');
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="mx-auto w-full max-w-md px-4 pt-8 pb-28">
        <header className="mb-6">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-bold text-brand-text tracking-tight">定制你的专属 AI 分身</h1>
            <button
              type="button"
              onClick={handleReset}
              className="mt-1 shrink-0 rounded-full border border-brand-primary/60 bg-white/70 px-3 py-1.5 text-xs font-medium text-brand-text hover:bg-white active:opacity-95"
            >
              重新开始
            </button>
          </div>
          <p className="mt-3 text-brand-text leading-relaxed">
            选几个懂你的标签，生成你的专属 AI 替身。<span className="text-brand-muted">（最少选 3 个板块）</span>
          </p>
          <div className="mt-4 rounded-2xl bg-white/70 border border-brand-primary/40 px-4 py-3 text-sm text-brand-muted">
            选择越具体，你的分身越像你；但你永远可以保留空白。
          </div>
        </header>

        <div className="space-y-4">
          <SectionCard title="基础标签" subtitle="从几个“最能代表你”的小点开始就好。">
            <div className="space-y-4">
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">MBTI</div>
                <div className="flex flex-wrap gap-2">
                  {BASIC_OPTIONS.mbti.map((v) => (
                    <Pill
                      key={v}
                      active={basic.mbti.includes(v)}
                      onClick={() =>
                        setBasic((p) => ({
                          ...p,
                          mbti: p.mbti.includes(v) ? [] : [v],
                        }))
                      }
                    >
                      {v}
                    </Pill>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">星座</div>
                <div className="flex flex-wrap gap-2">
                  {BASIC_OPTIONS.zodiac.map((v) => (
                    <Pill
                      key={v}
                      active={basic.zodiac.includes(v)}
                      onClick={() =>
                        setBasic((p) => ({
                          ...p,
                          zodiac: p.zodiac.includes(v) ? [] : [v],
                        }))
                      }
                    >
                      {v}
                    </Pill>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">常驻城市</div>
                <div className="flex flex-wrap gap-2">
                  {BASIC_OPTIONS.city.map((v) => (
                    <Pill
                      key={v}
                      active={basic.city.includes(v)}
                      onClick={() => setBasic((p) => ({ ...p, city: toggleInArray(p.city, v) }))}
                    >
                      {v}
                    </Pill>
                  ))}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">年龄段</div>
                <div className="flex flex-wrap gap-2">
                  {BASIC_OPTIONS.age.map((v) => (
                    <Pill
                      key={v}
                      active={basic.age.includes(v)}
                      onClick={() => setBasic((p) => ({ ...p, age: toggleInArray(p.age, v) }))}
                    >
                      {v}
                    </Pill>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="社会属性" subtitle="只需选一个大方向；细节想写再写。">
            <div className="flex flex-wrap gap-2">
              <Pill active={socialMode === 'school'} onClick={() => setSocialMode((m) => (m === 'school' ? null : 'school'))}>
                还在上学
              </Pill>
              <Pill active={socialMode === 'work'} onClick={() => setSocialMode((m) => (m === 'work' ? null : 'work'))}>
                已经工作
              </Pill>
            </div>

            {socialMode === 'school' && (
              <div className="mt-4 grid grid-cols-1 gap-3">
                <DegreePicker
                  value={school.degree}
                  onChange={(v) => setSchool((p) => ({ ...p, degree: v }))}
                />
                <LabeledInput label="高校 (选填，不写保持神秘～)" value={school.university} onChange={(v) => setSchool((p) => ({ ...p, university: v }))} placeholder="如：某某大学" />
                <LabeledInput label="专业 (选填)" value={school.major} onChange={(v) => setSchool((p) => ({ ...p, major: v }))} placeholder="如：心理学 / 法学" />
              </div>
            )}

            {socialMode === 'work' && (
              <div className="mt-4">
                <LabeledInput label="所在行业 (选填)" value={work.industry} onChange={(v) => setWork((p) => ({ ...p, industry: v }))} placeholder="如：互联网 / 金融 / 教育" />
              </div>
            )}
          </SectionCard>

          <SectionCard title="兴趣爱好" subtitle="你喜欢的，就是你身上的光。">
            <div className="flex flex-wrap gap-2">
              {HOBBIES.map((v) => (
                <Pill key={v} active={hobbies.includes(v)} onClick={() => setHobbies((p) => toggleInArray(p, v))}>
                  {v}
                </Pill>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="性格底色" subtitle="不用“完美”，真实就很动人。">
            <div className="flex flex-wrap gap-2">
              {PERSONALITY.map((v) => (
                <Pill key={v} active={personality.includes(v)} onClick={() => setPersonality((p) => toggleInArray(p, v))}>
                  {v}
                </Pill>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="感情偏好" subtitle="把边界说清楚，是温柔的一种。">
            <div className="flex flex-wrap gap-2">
              {LOVE_PREF.map((v) => (
                <Pill key={v} active={love.includes(v)} onClick={() => setLove((p) => toggleInArray(p, v))}>
                  {v}
                </Pill>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[9999] border-t border-qingteng-green-light/50 bg-white/80 backdrop-blur">
        <div className="mx-auto w-full max-w-md px-4 py-3">
          <button
            type="button"
            onClick={handleGenerate}
            className="w-full rounded-2xl bg-brand-primary text-brand-text py-3.5 font-semibold shadow-lg active:opacity-95"
          >
            生成专属分身并开启演习
          </button>
          <div className="mt-2 text-xs text-brand-muted text-center">
            当前已点亮 <span className="font-semibold text-brand-text">{selectedBoardCount}</span> / 3 个板块
          </div>
        </div>
      </div>

      {transitionOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50">
          <div className="max-w-sm w-full rounded-3xl overflow-hidden shadow-2xl border border-brand-primary/60 bg-brand-bg">
            <div className="bg-white px-5 py-6 border-b border-brand-primary/40">
              <div className="text-xl font-bold text-brand-text">🎉 AI 替身生成成功！</div>
            </div>

            <div className="p-5">
              <p className="text-sm text-brand-text leading-relaxed">
                （演示说明：在完整版中，对你心动的人将与这个替身进行社交演练。本次 Demo 中，请你转换视角，扮演【追求者】，去和我们的官方 AI 替身「小艺」搭讪吧！）
              </p>
            </div>

            <div className="p-5 pt-0">
              <button
                type="button"
                onClick={enterAsPursuer}
                className="w-full rounded-2xl bg-brand-primary text-brand-text py-3.5 font-semibold shadow-lg active:opacity-95"
              >
                扮演追求者，进入演习室
              </button>
              <button
                type="button"
                onClick={() => setTransitionOpen(false)}
                className="mt-3 w-full rounded-2xl border border-brand-primary/50 bg-white py-3 text-brand-text font-medium hover:bg-white/70 active:opacity-95"
              >
                我再改改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder }) {
  const [mainLabel, hint] = splitOptionalHint(label);
  return (
    <label className="block">
      <div className="text-sm font-medium text-brand-text mb-1">
        <span>{mainLabel}</span>
        {hint && <span className="ml-1 font-normal text-brand-muted">{hint}</span>}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-brand-text placeholder-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-primary/70"
      />
    </label>
  );
}

function splitOptionalHint(label) {
  const s = String(label ?? '');
  const idx = s.indexOf('(');
  const end = s.lastIndexOf(')');
  if (idx >= 0 && end > idx) {
    return [s.slice(0, idx).trim(), s.slice(idx, end + 1).trim()];
  }
  return [s, ''];
}

function DegreePicker({ value, onChange }) {
  const options = ['专科', '本科', '硕士', '博士'];
  return (
    <div>
      <div className="text-sm font-medium text-brand-text mb-2">学历层次</div>
      <div className="flex flex-wrap gap-2">
        {options.map((v) => (
          <Pill key={v} active={value === v} onClick={() => onChange(value === v ? '' : v)}>
            {v}
          </Pill>
        ))}
      </div>
    </div>
  );
}

