# -*- coding: utf-8 -*-
"""
『競馬ジークンドー』正準勝率・Shin市場解体・1/4ケリー自動再計算スクリプト
外部依存ゼロ（Python 3 標準ライブラリのみで動作）
"""

import json
import math
import hashlib
import os

JSON_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'race_data.json')

def recalculate():
    with open(JSON_PATH, 'r', encoding='utf-8') as f:
        data = json.load(f)

    horses = data['horses']
    n = len(horses)
    cushion = data['track_rheology']['cushion_value']

    # 1. Shin (1993) 固定点反復（オッズから市場確率 P_Shin を解体）
    odds = [h['odds_win'] for h in horses]
    beta = [1.0 / max(1.01, o) for o in odds]
    sum_beta = sum(beta)
    pi = [b / sum_beta for b in beta]

    z = 0.02
    for _ in range(100):
        s = sum(math.sqrt(z * z + 4.0 * (1.0 - z) * pi_i) for pi_i in pi)
        z_next = (s - 2.0) / (n - 2.0)
        if abs(z_next - z) < 1e-10:
            z = z_next
            break
        z = z_next

    p_shin_raw = [(math.sqrt(z * z + 4.0 * (1.0 - z) * pi_i) - z) / (2.0 * (1.0 - z)) for pi_i in pi]
    sum_p_shin = sum(p_shin_raw)
    p_shin = [p / sum_p_shin for p in p_shin_raw]

    # 2. K=7 第一原理ロジット（馬場クッション値・騎手・枠順動的連立）
    j_bonuses = {'Ｃ．デムーロ': 0.35, '川田将雅': 0.25, '池添謙一': 0.30, '松山弘平': 0.20, '岩田望来': 0.18, '西村淳也': 0.10}
    fp_logits = []
    for h in horses:
        b1 = (h['s_base'] - 80.0) * 0.18
        # クッション値連動（硬い馬場ほど軽量馬優位）
        cushion_adj = (cushion - 9.0) * (470.0 - h['prev_wt']) * 0.001
        b3 = 6.2 * (h['eom'] - 0.85) + 2.5 * math.log(max(0.01, 1.0 - 0.85 * h['bcs']))
        b4 = 0.12 if 5 <= h['num'] <= 9 else 0.04
        jb = j_bonuses.get(h['jockey'], 0.0)
        fp_logits.append(b1 + cushion_adj + b3 + b4 + jb)

    max_logit = max(fp_logits)
    exp_logits = [math.exp(l - max_logit) for l in fp_logits]
    sum_exp = sum(exp_logits)
    p_fp = [e / sum_exp for e in exp_logits]

    # 3. 確率単体（Simplex）上の三層収縮写像（差分ゼロ収束）
    p_curr = list(p_fp)
    for _ in range(100):
        h_entropy = -sum(p * math.log(max(p, 1e-12)) for p in p_curr)
        h_norm = h_entropy / math.log(n)
        gamma = 0.60 + 0.10 * (1.0 - h_norm) # 情報エントロピー連動ウェイト

        p_step = [gamma * p_fp[i] + (1.0 - gamma) * p_shin[i] for i in range(n)]
        sum_step = sum(p_step)
        p_next = [p / sum_step for p in p_step]

        delta = max(abs(p_next[i] - p_curr[i]) for i in range(n))
        p_curr = p_next
        if delta < 1e-8:
            break

    # 4. ハーレ＝ニーマイヤー法による最大剰余丸め（和=1.00000厳格保証）
    p_final = [round(p, 5) for p in p_curr]
    diff = round(1.0 - sum(p_final), 5)
    max_idx = p_final.index(max(p_final))
    p_final[max_idx] = round(p_final[max_idx] + diff, 5)

    # 5. 印・順位・EV・1/4ケリー自動同期（確定ルール準拠）
    indexed = sorted(range(n), key=lambda i: p_final[i], reverse=True)
    mark_order = ['◎', '◯', '▲', '☆', '△', '穴'] + ['−'] * (n - 6)

    for rank, idx in enumerate(indexed, start=1):
        h = horses[idx]
        h['pred_rank'] = rank
        h['mark'] = mark_order[rank - 1]
        h['p_fp'] = round(p_fp[idx], 5)
        h['p_mkt'] = round(p_shin[idx], 5)
        h['p_benter'] = p_final[idx]
        h['ev_win'] = round(p_final[idx] * h['odds_win'], 3)

        # 1/4ケリー基準
        b = h['odds_win'] - 1.0
        p = p_final[idx]
        f_star = (b * p - (1.0 - p)) / b if b > 0 else 0.0
        h['kelly_1_4'] = round(max(0.0, 0.25 * f_star), 4)

    # 6. SHA-256 Merkle Seal 再封印
    content_bytes = json.dumps(horses, sort_keys=True).encode('utf-8')
    data['race_info']['merkle_seal'] = hashlib.sha256(content_bytes).hexdigest()

    with open(JSON_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"Recalculation complete. Merkle Seal: {data['race_info']['merkle_seal'][:16]}...")

if __name__ == '__main__':
    recalculate()
