/* Chart data. Each key is referenced by <div class="chart" data-source="key">.
   ci:   {rows:[{label, sub, k, n, highlight, note}]}  — Wilson 95 % is computed
   bars: {rows:[{label, k, n} | {label, value}]}
   line: {points:[[x,y]], log, xLabel, yLabel, xTicks, yTicks} */
window.Report = window.Report || {};
window.Report.chartData = {
  "hm1-results": {"title": "Kịch bản 1", "rows": [{"label": "Phát lại demo", "sub": "Không dùng model · kiểm chứng backend", "k": 2, "n": 3}, {"label": "Khung cảnh Galileo dựng lại", "sub": "Checkpoint NVIDIA", "k": 28, "n": 50, "highlight": true}, {"label": "Khung cảnh tự dựng", "sub": "Checkpoint NVIDIA · xáo ±2 cm", "k": 0, "n": 50}]},
  "hm3-results": {"title": "Kịch bản 3", "rows": [{"label": "Local · mix200", "sub": "Điều kiện inside", "k": 66, "n": 100}, {"label": "Local · mix400", "sub": "Điều kiện inside", "k": 63, "n": 100}, {"label": "Local · mix400", "sub": "Inside · ngưỡng đứng yên 0,02", "k": 73, "n": 100, "highlight": true}]},
  "real2sim-groups": {"title": "Thành công theo nhóm", "rows": [{"label": "Táo", "k": 8, "n": 9}, {"label": "Nho", "k": 9, "n": 13}, {"label": "Khế", "k": 8, "n": 13}, {"label": "Lê", "k": 8, "n": 15}, {"label": "Quả bên trái", "k": 16, "n": 21}, {"label": "Quả bên phải", "k": 17, "n": 29}, {"label": "Tổng", "k": 33, "n": 50, "note": "Wilson 95 %: 52–78 %"}]},
  "hammer-loss": {"title": "Loss", "log": true, "xLabel": "Bước", "yLabel": "loss", "yTicks": [0.02, 0.05, 0.1, 0.2, 0.5, 1], "points": [[10, 1.2697], [110, 1.1186], [210, 0.6942], [310, 0.3935], [410, 0.2872], [510, 0.2183], [610, 0.145], [710, 0.1438], [810, 0.1149], [910, 0.1054], [1010, 0.1089], [1110, 0.0976], [1210, 0.0965], [1310, 0.0834], [1410, 0.0708], [1510, 0.0845], [1610, 0.0753], [1710, 0.0744], [1810, 0.0662], [1910, 0.0719], [2010, 0.0611], [2110, 0.0659], [2210, 0.0619], [2310, 0.0765], [2410, 0.0665], [2510, 0.0595], [2610, 0.0576], [2710, 0.0567], [2810, 0.0594], [2910, 0.064], [3010, 0.0554], [3110, 0.056], [3210, 0.0544], [3310, 0.0585], [3410, 0.0585], [3510, 0.0484], [3610, 0.0492], [3710, 0.0575], [3810, 0.0511], [3910, 0.0432], [4010, 0.0468], [4110, 0.0515], [4210, 0.0399], [4310, 0.0421], [4410, 0.0442], [4510, 0.048], [4610, 0.0446], [4710, 0.0414], [4810, 0.0414], [4910, 0.0396], [5010, 0.0428], [5110, 0.0394], [5210, 0.0352], [5310, 0.0396], [5410, 0.0367], [5510, 0.0367], [5610, 0.0412], [5710, 0.0355], [5810, 0.0312], [5910, 0.033], [6010, 0.0293], [6110, 0.0336], [6210, 0.0282], [6310, 0.032], [6410, 0.0302], [6510, 0.0308], [6610, 0.0292], [6710, 0.0298], [6810, 0.0277], [6910, 0.0267], [7010, 0.0284], [7110, 0.0266], [7210, 0.0256], [7310, 0.0296], [7410, 0.0243], [7510, 0.0256], [7610, 0.0243], [7710, 0.0253], [7810, 0.0233], [7910, 0.0251], [8010, 0.0252], [8110, 0.0237], [8210, 0.023], [8310, 0.0242], [8410, 0.0224], [8510, 0.0197], [8610, 0.0216], [8710, 0.0167], [8810, 0.0227], [8910, 0.0185], [9010, 0.0196], [9110, 0.019], [9210, 0.0184], [9310, 0.0203], [9410, 0.0198], [9510, 0.0185], [9610, 0.021], [9710, 0.0195], [9810, 0.0201], [9910, 0.0206], [10000, 0.0199]]},
  "eval-summary": {"title": "Tổng hợp", "rows": [{"label": "Táo · Isaac Lab Arena gốc", "sub": "Checkpoint và client NVIDIA · mốc tham chiếu", "k": 46, "n": 50}, {"label": "Táo · khung cảnh tự dựng", "sub": "Checkpoint NVIDIA · xáo ±2 cm", "k": 0, "n": 50}, {"label": "Táo · khung cảnh Galileo", "sub": "Checkpoint NVIDIA", "k": 28, "n": 50, "highlight": true}, {"label": "4 quả · đối chứng", "sub": "Checkpoint táo (tác vụ khác)", "k": 0, "n": 50}, {"label": "4 quả · real2sim", "sub": "Fine-tune real2sim", "k": 33, "n": 50, "highlight": true, "note": "0 lần gắp nhầm"}, {"label": "Búa · mix200", "sub": "Fine-tune 200 episode, 10k bước", "k": 66, "n": 100}, {"label": "Búa · mix400", "sub": "Fine-tune 400 episode, 20k bước", "k": 63, "n": 100}, {"label": "Búa · mix400, đếm thủ công", "sub": "Xem video lần chạy trên: búa nằm trong thùng, tay đã buông", "k": 87, "n": 100}, {"label": "Búa · mix400, ngưỡng 0,02", "sub": "Nới ngưỡng đứng yên · đợt chạy riêng", "k": 73, "n": 100, "highlight": true}]},
};

// Translations for sections with src/sections/i18n/ versions (data-source="<key>-<lang>").
(function (C) {
  C["hm3-results-en"] = {"title": "Scenario 3", "head": ["Evaluation", "Success"], "rows": [
    {"label": "Local · mix200", "sub": "Inside condition", "k": 66, "n": 100},
    {"label": "Local · mix400", "sub": "Inside condition", "k": 63, "n": 100},
    {"label": "Local · mix400", "sub": "Inside · at-rest threshold 0.02", "k": 73, "n": 100, "highlight": true}]};
  C["hm3-results-ja"] = {"title": "シナリオ 3", "head": ["評価", "成功"], "rows": [
    {"label": "ローカル · mix200", "sub": "inside 条件", "k": 66, "n": 100},
    {"label": "ローカル · mix400", "sub": "inside 条件", "k": 63, "n": 100},
    {"label": "ローカル · mix400", "sub": "inside · 静止しきい値 0.02", "k": 73, "n": 100, "highlight": true}]};
  C["hammer-loss-en"] = Object.assign({}, C["hammer-loss"], {"xLabel": "Step", "locale": "en-US"});
  C["hammer-loss-ja"] = Object.assign({}, C["hammer-loss"], {"xLabel": "ステップ", "locale": "ja-JP"});
  C["hm1-results-en"] = {"title": "Scenario 1", "head": ["Evaluation", "Success"], "rows": [
    {"label": "Demo replay", "sub": "No model · backend verification", "k": 2, "n": 3},
    {"label": "Reconstructed Galileo scene", "sub": "NVIDIA checkpoint", "k": 28, "n": 50, "highlight": true},
    {"label": "Project-built scene", "sub": "NVIDIA checkpoint · ±2 cm shuffle", "k": 0, "n": 50}]};
  C["hm1-results-ja"] = {"title": "シナリオ 1", "head": ["評価", "成功"], "rows": [
    {"label": "デモ再生", "sub": "モデル不使用 · バックエンド検証", "k": 2, "n": 3},
    {"label": "再構築した Galileo シーン", "sub": "NVIDIA チェックポイント", "k": 28, "n": 50, "highlight": true},
    {"label": "独自構築シーン", "sub": "NVIDIA チェックポイント · ±2 cm シャッフル", "k": 0, "n": 50}]};
  C["real2sim-groups-en"] = {"title": "Success by group", "rows": [
    {"label": "Apple", "k": 8, "n": 9}, {"label": "Grapes", "k": 9, "n": 13}, {"label": "Star fruit", "k": 8, "n": 13}, {"label": "Pear", "k": 8, "n": 15},
    {"label": "Fruit on the left", "k": 16, "n": 21}, {"label": "Fruit on the right", "k": 17, "n": 29}, {"label": "Total", "k": 33, "n": 50, "note": "Wilson 95 %: 52–78 %"}]};
  C["real2sim-groups-ja"] = {"title": "グループ別の成功", "rows": [
    {"label": "リンゴ", "k": 8, "n": 9}, {"label": "ブドウ", "k": 9, "n": 13}, {"label": "スターフルーツ", "k": 8, "n": 13}, {"label": "洋ナシ", "k": 8, "n": 15},
    {"label": "左側の果物", "k": 16, "n": 21}, {"label": "右側の果物", "k": 17, "n": 29}, {"label": "合計", "k": 33, "n": 50, "note": "Wilson 95 %: 52–78 %"}]};
  C["eval-summary-en"] = {"title": "Summary", "head": ["Evaluation", "Success"], "rows": [
    {"label": "Apple · original Isaac Lab Arena", "sub": "NVIDIA checkpoint and client · reference baseline", "k": 46, "n": 50},
    {"label": "Apple · project-built scene", "sub": "NVIDIA checkpoint · ±2 cm shuffle", "k": 0, "n": 50},
    {"label": "Apple · Galileo scene", "sub": "NVIDIA checkpoint", "k": 28, "n": 50, "highlight": true},
    {"label": "4 fruits · control", "sub": "Apple checkpoint (different task)", "k": 0, "n": 50},
    {"label": "4 fruits · real2sim", "sub": "Real2sim fine-tune", "k": 33, "n": 50, "highlight": true, "note": "0 wrong-fruit grasps"},
    {"label": "Hammer · mix200", "sub": "Fine-tune 200 episodes, 10k steps", "k": 66, "n": 100},
    {"label": "Hammer · mix400", "sub": "Fine-tune 400 episodes, 20k steps", "k": 63, "n": 100},
    {"label": "Hammer · mix400, manual count", "sub": "Videos of the run above: hammer in the bin, hand released", "k": 87, "n": 100},
    {"label": "Hammer · mix400, threshold 0.02", "sub": "Relaxed at-rest threshold · separate run", "k": 73, "n": 100, "highlight": true}]};
  C["eval-summary-ja"] = {"title": "総合", "head": ["評価", "成功"], "rows": [
    {"label": "リンゴ · 元の Isaac Lab Arena", "sub": "NVIDIA のチェックポイントとクライアント · 参照基準", "k": 46, "n": 50},
    {"label": "リンゴ · 独自構築シーン", "sub": "NVIDIA チェックポイント · ±2 cm シャッフル", "k": 0, "n": 50},
    {"label": "リンゴ · Galileo シーン", "sub": "NVIDIA チェックポイント", "k": 28, "n": 50, "highlight": true},
    {"label": "果物 4 種 · 対照", "sub": "リンゴのチェックポイント（別タスク）", "k": 0, "n": 50},
    {"label": "果物 4 種 · real2sim", "sub": "real2sim でファインチューニング", "k": 33, "n": 50, "highlight": true, "note": "誤った果物の把持 0 回"},
    {"label": "ハンマー · mix200", "sub": "200 エピソード、10k ステップでファインチューニング", "k": 66, "n": 100},
    {"label": "ハンマー · mix400", "sub": "400 エピソード、20k ステップでファインチューニング", "k": 63, "n": 100},
    {"label": "ハンマー · mix400、目視カウント", "sub": "上の実行の動画：ハンマーがビンの中、手は離れている", "k": 87, "n": 100},
    {"label": "ハンマー · mix400、しきい値 0.02", "sub": "静止しきい値を緩和 · 別の実行", "k": 73, "n": 100, "highlight": true}]};
})(window.Report.chartData);
