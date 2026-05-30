'use client';

interface Props {
  show: boolean;
  onClose: () => void;
}

export default function HupuPrompt({ show, onClose }: Props) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-sm w-full border border-gray-600 text-center">
        <div className="text-4xl mb-3">🏀</div>
        <h3 className="text-xl font-black text-white mb-1">打开虎扑APP</h3>
        <p className="text-gray-400 text-sm mb-6">在虎扑APP中体验完整功能</p>
        <div className="flex flex-col gap-2">
          <a
            href="https://games.mobileapi.hupu.com/landing?clt=&r=kqappshare_news&os=android&schema=huputiyu%3A%2F%2Fwebview%2Fopenencodeurl%3FshowMoreBtn%3D1%26url%3Dhttps%253A%252F%252Factivity-static.hupu.com%252Fcolorbox-activities%252Factivity-260522-ubslrpvx%252Findex.html&fallback_url=https%3A%2F%2Factivity-static.hupu.com%2F&is_open_schema=0&biz_code=&auto_install="
            target="_blank"
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-black text-lg py-3 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] block text-center"
          >
            立即打开
          </a>
          <button
            onClick={onClose}
            className="w-full bg-white/10 hover:bg-white/20 text-white/70 font-bold py-3 rounded-xl transition-colors"
          >
            我再想想
          </button>
        </div>
      </div>
    </div>
  );
}
