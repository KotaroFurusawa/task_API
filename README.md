# TaskAPI(Version0.1)仕様書

## 基本操作
- タスクを開始するとき: 
- 「#start」とテキストに含める
- タスク内容を記録したいとき:「#todo」とテキストに含めたあと，「-」に続けてタスクをかく．
*複数タスクを書く場合は必ず改行する*
*タスク以外にコメント等を書いても構いませんが，スプレッドシートには反映されません*

### 例
```
#start
#todo
-数学
-英語
-理科
眠いけどがんばるーーーー！！！
```

- 上の例の場合，「眠いけどがんばるーーーー！！！」のコメントはbotの動作に影響を与えません．

- タスクを終了するとき:
- 「#finish」とテキストに含める
- 終了タスクを記録したいとき:「#done」とテキストに含めたあと，「-」に続けて終了したタスクをかく．
*複数の終了したタスクを書く場合は必ず改行する*
*終了タスク以外にコメント等を書いても構いませんが，スプレッドシートには反映されません*

### 例
```
#finish
#done
-複素関数論
-議事録作成
疲れたああああ！！！
```

- 上の例の場合，「疲れたああああ！！！」のコメントはbotの動作に影響を与えません．


## 注意
- '#'(シャープ)と'-'(ハイフン)は半角英字です
- botから返答がない場合は60秒ぐらい待って，メッセージ送り直してみてください．
- LINE通話を繋いでいなくても説明通りのコマンドを打てば，作業時間が記録されます．
- 「#start」と「#finish」だけ含まれていればbotは動作するので「#todo」と「＃done」は任意です．

## その他
- まだリリースしたばかりでエラー等あると思うので，不具合が生じたら報告くれると嬉しいです！
- わからないことがあったら，いつでも気軽に聞いてください！
- 打刻修正は@Kotaro に頼んでください！
