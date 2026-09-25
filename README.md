# Research Hub — 研究生学术成果与投稿管理台

单文件纯前端应用，MiMo（mimo.xiaomi.com）设计语言。数据只存在本机浏览器，
用 JSON 导出 / 导入做备份和迁移。

## 打开方式

双击 `index.html` 即可（Chrome / Edge / Safari 都行）。
也可以挂到任意静态目录下作为独立子站（例如 `citeglow.com/research-hub/`）。

## 文件

| 文件 | 作用 |
|---|---|
| `index.html` | 页面结构 |
| `style.css` | MiMo 设计系统（色板 / 字号 / 间距 / 动效） |
| `app.js` | 数据模型、状态机、编辑器、简历导出 |

## 功能

**01 总览** — 快速录入、五类成果计数、研究者身份卡、控制台时钟、成果图谱、
近期节点倒计时、状态变更时间线（全局封顶 200 条）、资料架

**02–05 成果管理**
- 小论文（9 级流水线）：构思 → 写作中 → 待投稿 → 已投稿 → 审稿中 → 大修 / 小修 → 录用 → 见刊
- 大论文（8 级）：选题 → 开题 → 撰写中 → 中期 → 预答辩 → 盲审 → 答辩通过 → 终稿归档
- 专利（9 级）：创意 → 交底书 → 撰写中 → 已提交 → 受理 → 初审 → 实质审查 → 已授权 → 维持有效
- 软著（6 级）：开发中 → 材料准备 → 已提交 → 已受理 → 已登记 → 已下证
- 软件（5 级）：开发中 → 内测 → 已发布 → 迭代维护 → 已归档

每条记录带：详细字段（分区 / 影响因子 / 申请号 / 登记号 / 技术栈 …）、
章节进度表、关键节点表、资料清单、自动时间线、**里程碑点条**。
「推进 →」/「← 撤回」双向走状态，状态变化自动写时间线；条目到达定稿状态时，
自动勾掉关联的倒计时节点。关联节点 14 天内到期会在卡片上高亮。

**快速录入** — 总览顶部：类型 + 标题 + 可选截止日，回车即建条目。

**拖拽挂资料** — 把文件拖到成果行或资料架虚线框，登记文件名 / 大小到该条附件。

**06 简历墙** — 一键生成简历格式文本
- 语言：中文 / English / 中英对照
- 格式：简历条目（带身份与状态标注）/ 参考文献（含 DOI）/ 要点速览 / 资料清单
- 范围：仅已定稿 / 全部
- 分组：按类别 / 按年份
- 复制 · 下载 .txt · 打印（打印时自动隐藏界面，只留成果）

署名栏填了中英文姓名后，学位论文 / 软著这类没有作者字段的条目会自动带上署名。

## 数据

- 存储：`localStorage`，键 `research-hub.v1`
- 备份：右上角「导出」→ `research-hub-YYYY-MM-DD.json`
- 迁移：新机器「导入」该文件即可（会覆盖当前数据，有确认提示）
- 首次打开会预置 6 条软著（对应 `Software-copyright/` 里的 6 份说明文档）
  和 1 条软件成果，可随意修改或删除

## 云同步（GitHub 登录，与主站同账号）

与 citeglow 主站共用同一 Supabase / GitHub 登录；**成果台账单独存表** `user_research_hub`，不与主站论文列表混用。

首次需在 Supabase SQL Editor 执行：

```sql
create table if not exists public.user_research_hub (
  user_id uuid primary key references auth.users(id) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.user_research_hub enable row level security;
create policy "Users can read own hub" on public.user_research_hub for select using (auth.uid() = user_id);
create policy "Users can insert own hub" on public.user_research_hub for insert with check (auth.uid() = user_id);
create policy "Users can update own hub" on public.user_research_hub for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

未登录仍只使用本地 localStorage。

## OpenAlex 查引用

编辑「小论文」时，顶部输入 DOI 或标题 →「查询 OpenAlex」，自动填作者 / 期刊 / 年份 / DOI。

## 倒计时 / 提醒

「添加节点」录入截稿日、答辩日、专利答复期限等。7 天内到期会在页面顶部出提醒条，
点「开启桌面提醒」可授权浏览器桌面通知。

## 设计规范来源

取自 mimo.xiaomi.com 实测视觉数据：暖灰白 `#FAF7F5`、1px 纯黑分隔线、
直角零阴影、MiSans 字族（回退 PingFang / 微软雅黑）、4px 间距基数、
青绿 `#5ED4AD` 稀缺点缀、动效只改 color / opacity 不做位移弹跳。
响应式断点 480 / 768 / 1024 / 1200 / 1440。
