# PROJECT_CHARTER.md

This document defines the long-term philosophy, brand identity, development principles, and public policies of the TUTTO Framework project. When implementation decisions conflict with this charter, this charter takes precedence.

本書はTUTTO Frameworkプロジェクトの理念・ブランド・開発原則・公開方針を定義する最上位文書です。実装と本書の内容が矛盾する場合は、本書を優先します。

---

## 1. Project Identity

**TUTTO**

**Market Structure Observation Framework**

市場構造を観測し、判断するための分析フレームワーク。

TUTTOは単なるインジケーターではありません。市場構造を観測し、人間が判断するためのFrameworkです。

---

## 2. Manifesto

TUTTOは、市場を予測するためのものではありません。

市場には絶対はありません。だからこそ、TUTTOは未来を断定せず、市場がどの構造を採用し、どの構造を拒否したのかを観測します。

TUTTO Frameworkは、価格そのものを最優先に扱います。チャートが市場を説明し、人間がその構造を読み取り、自ら判断するための土台を作ります。

TUTTOが目指すものは、売買シグナルの量産ではありません。市場構造の理解、観測、整理、そして判断の質を高めることです。

---

## 3. Core Philosophy

市場を予測するのではない。

市場が採用した構造を観測する。

---

## 4. Mission

市場構造を観測し、判断するための分析フレームワークを構築する。

---

## 5. Framework

TUTTO Frameworkは、次の順序で構成されます。

```text
Manifesto
↓
Philosophy
↓
Structure Theory
↓
Market Layer
↓
STATE
↓
Trade Plan
↓
Official Terminology
```

各要素は独立した説明単位でありながら、TUTTOの中核思想である「市場構造の観測」に従属します。

---

## 6. Official Terminology

### Publicly Prohibited Terms

公開サイトでは、以下の用語を使用しません。

- Fibonacci
- Fib
- フィボナッチ
- Market Geometry

### Official Terms

公開サイトでは、以下の正式語へ統一します。

- 構造
- 構造起点
- 構造認証点
- 構造候補
- 構造受容
- 構造認証
- 構造拡張
- 構造遷移
- 構造無効化

---

## 7. Public Site Policy

公開サイトでは、以下を公開しません。

- 独自構造比率
- GSI
- 内部ロジック
- 判定条件
- スコアリング
- 秘密アルゴリズム

公開するのはTUTTO Frameworkの思想、構造、教育的説明、開発状況に限定します。

---

## 8. Architecture Principles

TUTTOの実装・ドキュメント・サイト設計では、以下を遵守します。

- SSOT（Single Source of Truth）
- Clean Architecture
- DDD（Domain Driven Design）
- DTO Only
- Presentationでロジック禁止
- Visualizationで再計算禁止

Presentationは表示用の変換のみを担当します。VisualizationはDTO由来の内容を描画するだけであり、独自に価格、状態、判定を再計算してはいけません。

---

## 9. Git Workflow

TUTTO公式サイトの開発では、以下を正式ルールとします。

- 1 Phase = 1 Pull Request

### Prohibited

- mainへ直接Push
- force push
- Cloudflare変更（専用PRのみ）

Cloudflare Pages設定、デプロイ設定、ルーティング設定に影響する変更は、専用Phaseとして分離します。

---

## 10. Website Structure

TUTTO公式サイトの基本ナビゲーションは以下です。

- HOME
- Framework
- Research
- Education
- Indicator
- Roadmap

Frameworkが最上位のブランド・思想ページです。Research、Education、Indicator、RoadmapはFrameworkの下位文脈として扱います。

---

## 11. Brand Identity

### Name

TUTTO

### Subtitle

Market Structure Observation Framework

### Catch Copy

市場を予測するのではない。

市場が採用した構造を観測する。

---

## 12. Version 1.0 Goals

TUTTO v1.0では、以下の公開基盤を整備します。

- Framework
- Research
- Education
- Indicator
- Website
- Release

Version 1.0の目的は、TUTTO Frameworkの思想、ブランド、公開サイト、研究導線、Indicator導線を一貫した形で成立させることです。

---

## 13. Long-term Vision

TUTTOはインジケーターではありません。

TUTTOはFrameworkです。

インジケーターは、TUTTO Frameworkを実装する1つのツールに過ぎません。将来的には、Research、Education、Indicator、分析ツール、検証環境へ展開できる長期的な市場構造観測基盤として育てます。

---

## 14. TUTTO Promise

市場に絶対はありません。

だからこそ、私たちは予測ではなく観測を大切にします。

学び続けること。

構造を理解すること。

そして、自ら判断すること。

それが、TUTTO Frameworkです。

---

## 15. TUTTO Declaration

知識は、希望になる。

観測は、判断になる。

判断は、自信になる。

そして、その積み重ねが未来を変えていく。

TUTTO Frameworkは、その最初の一歩を支えるために存在します。