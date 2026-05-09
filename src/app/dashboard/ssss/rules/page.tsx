export default function SsssRulesPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">SSSS 運用ルール</h1>
        <p className="text-sm text-gray-500 mt-1">サンプルシール支給システム 業務フロー</p>
      </div>

      {/* フロー概要 */}
      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
        {[
          { no: "①", label: "仮受注・受注発生" },
          { no: "②", label: "支給管理票入力" },
          { no: "③", label: "準備・発送" },
          { no: "④", label: "受取・受領確認" },
        ].map((step, i) => (
          <div key={i} className="flex items-center gap-2 flex-shrink-0">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-yellow-400 flex items-center justify-center text-white font-bold text-sm">
                {step.no}
              </div>
              <p className="text-xs text-gray-600 mt-1 text-center whitespace-nowrap">{step.label}</p>
            </div>
            {i < 3 && <div className="text-gray-300 text-2xl mb-4">→</div>}
          </div>
        ))}
      </div>

      <div className="space-y-6">

        {/* ① */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-yellow-400 px-6 py-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white text-yellow-500 font-bold flex items-center justify-center text-sm">①</span>
            <h2 className="text-base font-bold text-white">仮受注・受注発生</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 mb-4">付け合わせ伝票を確認し、サンプルシールが必要な部品を特定します。</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex gap-3">
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">東京生管・業務</span>
                <p className="text-sm text-gray-700">付け合わせ伝票のサンプルシール欄を確認し、必要な部品・数量を把握する</p>
              </div>
            </div>
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
              <p className="text-xs text-gray-500 font-medium mb-1">📋 付け合わせ伝票とは</p>
              <p className="text-xs text-gray-600">受注時に発行される伝票。サンプルシール欄にシールが必要な部品（例：SS2 ステッカー外貼り）が記載されており、バーコード・品番・納入場所などが確認できる。</p>
            </div>
          </div>
        </div>

        {/* ② */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-yellow-400 px-6 py-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white text-yellow-500 font-bold flex items-center justify-center text-sm">②</span>
            <h2 className="text-base font-bold text-white">サンプルシール支給管理票入力</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 mb-4">支給管理表に必要事項を入力し、発送依頼メールを送信します。</p>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">東京生管・業務</span>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>★マーク項目（品番・受注No・貼り付けパーツ・起票者）を入力する</p>
                    <p>入力後、<span className="inline-flex items-center gap-1 bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded">✉ メール</span>ボタンを選択して送信（発送依頼メールが静岡生管へ送信される）</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">静岡生管</span>
                  <p className="text-sm text-gray-700">メール受信後、支給管理表の項目が正しく作成されているか確認する</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ③ */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-yellow-400 px-6 py-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white text-yellow-500 font-bold flex items-center justify-center text-sm">③</span>
            <h2 className="text-base font-bold text-white">数量決定後、必要枚数を準備・発送</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 mb-4">数量が確定したら、シールを準備して発送します。</p>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex gap-3">
                <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">静岡生管</span>
                <div className="text-sm text-gray-700 space-y-1">
                  <p>支給管理表に以下を入力する：</p>
                  <ul className="list-disc list-inside text-xs text-gray-600 ml-2 space-y-0.5">
                    <li>支給枚数（静岡・東京保管）</li>
                    <li>島田PC担当者名</li>
                    <li>発送日</li>
                  </ul>
                  <p className="mt-1">入力後、受領担当者宛に発送する</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ④ */}
        <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
          <div className="bg-yellow-400 px-6 py-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-white text-yellow-500 font-bold flex items-center justify-center text-sm">④</span>
            <h2 className="text-base font-bold text-white">受取・受領確認</h2>
          </div>
          <div className="px-6 py-5">
            <p className="text-sm text-gray-600 mb-4">シールを受け取り、受領確認を行います。送り状兼受領書を保管します。</p>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded whitespace-nowrap">東京生管・業務</span>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p>支給管理表に受取日を入力する</p>
                    <p>外注担当者へ引き渡し完了後、受領書に受領サインをもらう</p>
                    <p>受領書（送り状兼受領書）はファイルに保管する</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded whitespace-nowrap">静岡生管</span>
                  <p className="text-sm text-gray-700">支給管理表で受領済みになっているか確認する</p>
                </div>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-3">
                <p className="text-xs text-gray-500 font-medium mb-1">📄 送り状兼受領書とは</p>
                <p className="text-xs text-gray-600">サンプルシール発送時に同封する書類。受領者のサインをもらい、控えをファイル保管する。SSSSの「送り状兼受領書」メニューから出力可能。</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 補足 */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl px-6 py-5">
        <h3 className="text-sm font-bold text-gray-700 mb-3">補足・注意事項</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-yellow-500 font-bold flex-shrink-0">•</span>支給管理表の★マーク項目は必須入力です</li>
          <li className="flex gap-2"><span className="text-yellow-500 font-bold flex-shrink-0">•</span>メール送信後は静岡生管への連絡が不要です（自動送信されます）</li>
          <li className="flex gap-2"><span className="text-yellow-500 font-bold flex-shrink-0">•</span>受領書は必ずファイルに保管してください</li>
          <li className="flex gap-2"><span className="text-yellow-500 font-bold flex-shrink-0">•</span>不明点は静岡生管または東京生管・業務担当者へ確認してください</li>
        </ul>
      </div>
    </div>
  )
}
