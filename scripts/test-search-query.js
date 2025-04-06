const dotenv = require('dotenv');
const path = require('path');
const { MongoClient } = require('mongodb');

// 環境変数の読み込み
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error('MongoDB URI が設定されていません。.env.local ファイルを確認してください。');
  process.exit(1);
}

async function testSearch() {
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('MongoDB に接続しました');

    const db = client.db('training-board');
    const collection = db.collection('questions');

    const testQueries = ['マラソン', '練習メニュー', 'ランニング'];

    // 全質問数の確認
    const totalCount = await collection.countDocuments();
    console.log(`データベース内の質問数: ${totalCount}`);

    // タイトルと内容の一部を表示（サンプルとして5件）
    console.log('\n=== サンプル質問 ===');
    const samples = await collection.find({}).limit(5).toArray();
    samples.forEach((q, i) => {
      console.log(`[${i+1}] タイトル: ${q.title}`);
      console.log(`    内容の一部: ${q.content.substring(0, 50)}...`);
      console.log();
    });

    // 各テストクエリで検索テスト
    for (const query of testQueries) {
      console.log(`\n=== 検索クエリ: "${query}" ===`);
      
      // 正規表現検索用にエスケープ
      const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      // $or 検索（タイトルまたは内容に一致）
      const results = await collection.find({
        $or: [
          { title: { $regex: escapedQuery, $options: 'i' } },
          { content: { $regex: escapedQuery, $options: 'i' } },
        ],
      }).toArray();

      console.log(`検索結果数: ${results.length}`);
      
      if (results.length > 0) {
        console.log('検索結果:');
        results.forEach((q, i) => {
          console.log(`[${i+1}] タイトル: ${q.title}`);
          // content に一致する部分があれば、その周辺のコンテキストを表示
          const contentMatch = q.content.match(new RegExp(`.{0,20}${escapedQuery}.{0,20}`, 'i'));
          if (contentMatch) {
            console.log(`    一致: ...${contentMatch[0]}...`);
          }
          console.log();
        });
      } else {
        console.log(`"${query}" に一致する質問は見つかりませんでした。`);
      }
    }

    // タグの検索テスト
    console.log('\n=== タグフィールドの確認 ===');
    const hasTags = await collection.countDocuments({ tags: { $exists: true, $ne: [] } });
    console.log(`タグが設定されている質問数: ${hasTags}`);
    
    // タグの例を表示
    if (hasTags > 0) {
      const tagSamples = await collection.find({ tags: { $exists: true, $ne: [] } }).limit(3).toArray();
      console.log('タグの例:');
      tagSamples.forEach((q, i) => {
        console.log(`[${i+1}] タイトル: ${q.title}`);
        console.log(`    タグ: ${q.tags.join(', ')}`);
      });
    }

  } catch (err) {
    console.error('エラーが発生しました:', err);
  } finally {
    await client.close();
    console.log('\nMongoDB 接続を閉じました');
  }
}

// スクリプト実行
testSearch().catch(console.error); 