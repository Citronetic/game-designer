# Game Forge — 游戏设计工作流插件

一个 Claude Code 技能插件，引导任何人——从资深游戏策划到初次构思者——完成结构化的多会话游戏设计流程。从一个原始的游戏创意出发，Game Forge 作为 AI 共创者，产出开发者实现游戏所需的全套文档。

## 产出物

| 阶段 | 输出 | 说明 |
|------|------|------|
| 1. 策划总纲 | 15 章文件 | 目标用户、核心玩法、系统循环、关卡内容、数值难度、新手引导、留存设计、广告商业化、美术风格、UI/UX、技术方案、数据体系、收益测算 |
| 2. 系统设计 | 逐系统规格文件 | 系统ID、规则、状态、依赖、下游承接包（数据/美术/UI/技术锚点）、程序合同、一周内容节奏 |
| 3A. 数据建表 | 表定义 + CSV | 字段级定义、ER关系、枚举、ID规范、存档/迁移、样例数据 |
| 3B. 数值配置 | 难度 + 经济文档 | 难度曲线、资源产消、商业化边界、调参/回滚策略 |
| 4. 生产需求 | 美术/UI/技术需求 | 资产清单、页面架构、交互流程、模块边界、客户端/服务端分工 |

## 安装

### Claude Code

将技能和智能体复制到你的项目或用户级 `.claude/` 目录：

```bash
# 克隆仓库
git clone https://github.com/citronetic/game-designer.git

# 复制到你的项目（项目级）
cp -r game-designer/.claude/skills/ your-project/.claude/skills/
cp -r game-designer/.claude/agents/ your-project/.claude/agents/
cp -r game-designer/bin/ your-project/bin/

# 或复制到用户级（所有项目可用）
cp -r game-designer/.claude/skills/ ~/.claude/skills/
cp -r game-designer/.claude/agents/ ~/.claude/agents/
cp -r game-designer/bin/ ~/bin/
```

### OpenCode

OpenCode 使用相同的 `.claude/` 目录结构，按相同方式复制文件即可：

```bash
cp -r game-designer/.claude/skills/ your-project/.claude/skills/
cp -r game-designer/.claude/agents/ your-project/.claude/agents/
cp -r game-designer/bin/ your-project/bin/
```

> **注意：** OpenCode 可能使用不同的工具名称。技能中引用了 `AskUserQuestion` 和 `Agent` 工具——请确认你的 OpenCode 版本支持这些工具。

### 环境要求

- **Node.js** >= 16.7.0（用于 CLI 工具）
- **无 npm 依赖** — 所有工具仅使用 Node.js 内置模块

## 快速开始

1. **创建新游戏项目：**
   ```
   /gf-new-game
   ```
   AI 会询问：项目名称、语言、游戏类型、起始方式（从零开始或参考现有游戏）。

2. **创建策划总纲：**
   ```
   /gf-concept
   ```
   AI 与你共创 15 章策划文档，每次会话 2-3 章。

3. **展开系统设计：**
   ```
   /gf-system-design
   ```
   AI 从策划总纲中提取系统列表，然后逐系统设计完整规格。

4. **生成数据表结构：**
   ```
   /gf-data-schema
   ```
   自动从系统设计锚点生成表定义，含 CSV 导出。

5. **填充数值配置：**
   ```
   /gf-balance
   ```
   在冻结的表结构上填充难度曲线、经济数值和调参策略。

6. **生成生产需求文档：**
   ```
   /gf-production
   ```
   并行生成美术、UI/UX、技术需求文档。支持 `--art-only`、`--ui-only`、`--tech-only` 单独生成。

## 命令参考

| 命令 | 说明 |
|------|------|
| `/gf-new-game` | 初始化新游戏项目（询问名称、语言、类型、起始方式） |
| `/gf-concept` | 阶段1：创建策划总纲（15章，每次会话2-3章） |
| `/gf-system-design` | 阶段2：展开完整系统设计 |
| `/gf-data-schema` | 阶段3A：生成数据表定义及CSV导出 |
| `/gf-balance` | 阶段3B：填充数值配置（难度、经济、调参） |
| `/gf-production` | 阶段4：生成美术/UI/技术需求（`--art-only`、`--ui-only`、`--tech-only`） |
| `/gf-progress` | 查看当前阶段进度（含管线可视化） |
| `/gf-resume` | 从上次中断处恢复 |
| `/gf-export` | 重新导出数据表为 CSV |

## 工作原理

### AI 共创者

Game Forge 不只是整理你的输入——它**主动提出**游戏设计方案：
- 提出具体的机制、系统和数值方案并说明理由
- 挑战模糊回答（"有趣的玩法" → "玩家具体在做什么？"）
- 自动修复检测到的结构性问题
- 仅在需要创意决策时才暂停等待你的输入

### 多会话工作流

游戏设计文档体量太大，无法在单次会话中完成。Game Forge 将工作拆分到多个会话：
- **策划总纲：** 每次会话 2-3 章（约 5-7 次会话）
- **系统设计：** 每次会话 1-2 个系统
- **数据/数值/需求：** 自动生成，通常 1-2 次会话

会话状态保存在 `.gf/STATE.md` — 运行 `/gf-resume` 即可从中断处继续。

### 类型适配

6 种游戏类型自动适配流程：
- **休闲** — 广告变现为主，短会话，简单循环
- **RPG** — 深度成长，角色系统，叙事元素
- **益智** — 关卡生成，难度曲线，机制叠加
- **策略** — 资源管理，科技树，AI对手
- **放置** — 离线收益，转生系统，指数增长
- **动作** — 战斗系统，怪物设计，技巧型难度

系统根据类型自动跳过不相关的章节/模块。

### 质量门禁

每个阶段之间有自动质量检查：
- **自动修复：** 缺失章节、缺失ID、前后矛盾、深度不足
- **需要你决定：** 核心玩法选择、商业化模式、目标用户、范围边界
- 生成 `REVIEW.md` 展示检查和修复内容

### 可追溯性

每个产出物都可追溯到源头：
```
策划规则 (R_3_01) → 系统规则 (RULE-COMBAT-001) → 数据表 (monsters) → 数值 → 美术资产
```
ID 注册表 (`.gf/traceability/id-registry.json`) 支持自动跨阶段验证。

## 项目结构

运行 `/gf-new-game` 后创建以下结构：

```
.gf/
  config.json              # 项目配置（语言、类型等）
  STATE.md                 # 当前阶段、会话连续性
  PROJECT.md               # 游戏概要
  stages/
    01-concept/            # 阶段1：策划总纲章节
    02-system-design/      # 阶段2：系统设计
      systems/             # 逐系统规格文件
      CONTENT-RHYTHM.md    # 一周内容节奏表
    03a-data-schema/       # 阶段3A：数据表定义
      configs/             # CSV 导出
    03b-balance/           # 阶段3B：数值配置
    04-production/         # 阶段4：生产需求
  traceability/
    id-registry.json       # 跨阶段ID追踪
```

## 运行测试

```bash
node --test bin/lib/*.test.cjs
```

254 个测试，零外部依赖。

## 许可证

MIT
