# NBA Draft Battle - 项目待办

## 已完成

- [x] 按参考设计重写全部组件 (Card, PackOpener, DraftBoard, LineupResult, Leaderboard)
- [x] 游戏流程: INTRO → OPENING (5轮×10卡) → DRAFTING → RESULT → LEADERBOARD
- [x] 3D 翻牌动画 (backface-visibility 修复)
- [x] 卡片缩放适配 (scale + overflow-hidden 方案)
- [x] 稀有度颜色: N=绿, R=蓝, SR=紫, SSR=黄橙, UR=彩虹
- [x] 上滑跳过卡片、Skip Round 功能
- [x] 轮次展示页 (Round Summary) - 2列网格居中
- [x] 阵容页三行布局: PF SF / C / PG SG
- [x] 评分精确到小数 (去 Math.round)
- [x] 文字统一白色、OVR/稀有度徽章放大
- [x] PK 对战系统 - 后端 API (Supabase)
  - upload: 上传阵容 + 服务端校验分数防作弊
  - matchmake: 分数区间匹配对手 + 计算胜负
  - history: 对战历史记录
  - leaderboard: 真实排行榜 (胜率排序)
- [x] PK 对战系统 - 前端组件
  - NicknameModal: 昵称输入弹窗
  - BattleResult: 对战结果 (位置对位 + 雷达图对比)
  - BattleHistory: 历史对战列表
  - Leaderboard: 重写为真实数据 (胜/负/胜率/最高分)
- [x] 游戏流程集成: ENTER_NICKNAME → BATTLE → LEADERBOARD / BATTLE_HISTORY

## 待完成

### PK 系统上线
- [ ] 创建 Supabase 项目并运行建表 SQL
- [ ] 配置 `.env.local` (SUPABASE_URL + ANON_KEY)
- [ ] 端到端测试: 开卡 → 选人 → 输入昵称 → 上传 → 匹配 → 对战 → 排行榜
- [ ] 测试昵称唯一性校验
- [ ] 测试多次上传阵容 (旧阵容自动 deactive)
- [ ] 测试无对手时的错误提示

### 功能优化
- [ ] 对战结果页位置对位的小卡片布局优化 (移动端)
- [ ] 再战一场 (Battle Again) 后 loading 状态优化
- [ ] 排行榜分页/虚拟滚动 (数据量大时)
- [ ] 对战历史展开查看详细数据
- [ ] 分享阵容功能 (复制链接/截图)

### 部署
- [ ] Vercel 部署配置
- [ ] players.json 移入 public 目录 (Vercel 不支持 fs 读上级目录)
- [ ] 配置 Vercel 环境变量 (Supabase)
- [ ] 域名配置

### 未来可选
- [ ] 用户认证 (Supabase Auth 替代昵称+UUID)
- [ ] 实时对战模式
- [ ] 赛季/天梯排名
- [ ] 更多卡包/球员数据更新
