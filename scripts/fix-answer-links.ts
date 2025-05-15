import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // .env.localから環境変数を読み込む

import mongoose from 'mongoose';
import dbConnect from '../src/lib/dbConnect'; // dbConnectのパスを調整
import AnswerModel from '../src/models/Answer'; // モデルのパスを調整
import QuestionModel from '../src/models/Question'; // モデルのパスを調整

async function fixAnswerLinks() {
  console.log('Connecting to database...');
  await dbConnect();
  console.log('Database connected.');

  try {
    console.log('Fetching all answers...');
    const allAnswers = await AnswerModel.find({}).lean(); // lean()で軽量化
    console.log(`Found ${allAnswers.length} answers.`);

    let updatedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;

    for (const answer of allAnswers) {
      const answerId = answer._id;
      const questionId = answer.question;

      if (!questionId) {
        console.warn(`Answer ${answerId} has no question ID. Skipping.`);
        skippedCount++;
        continue;
      }

      console.log(`Processing Answer ${answerId} for Question ${questionId}...`);

      try {
        // 対応する質問を探し、$addToSetで回答IDを追加 (存在しない場合のみ追加)
        const updateResult = await QuestionModel.findByIdAndUpdate(
          questionId,
          { $addToSet: { answers: answerId } }, // $addToSetで重複を防ぐ
          { new: true } // 更新結果は不要なら削除しても良い
        );

        if (updateResult && updateResult.answers && Array.isArray(updateResult.answers)) {
          if (updateResult.answers.map(String).includes(String(answerId))) {
            updatedCount++;
          }
        }

        if (updateResult) {
          // 更新が成功したか、もともと含まれていたかを確認
          // $addToSet は追加した場合も、既にあって追加しなかった場合もドキュメントを返す
          // より厳密に確認したい場合は更新前後の answers 配列を比較する
          console.log(` -> Question ${questionId} link checked/updated for Answer ${answerId}.`);
          // 簡単なチェック: 更新後の answers 配列に ID が含まれているか
          if (updateResult.answers.map(String).includes(String(answerId))) {
             // updateResult は更新後のドキュメントなので、更新された or もともとあった
             // ここでは簡易的に updatedCount に含める
             updatedCount++;
          } else {
             // $addToSet が期待通り動作しなかった場合 (理論上考えにくい)
             console.warn(` -> [Check Warning] Answer ${answerId} not found in Question ${questionId} answers after $addToSet.`);
             skippedCount++;
          }

        } else {
          console.warn(` -> Question ${questionId} not found for Answer ${answerId}. Skipping link.`);
          skippedCount++;
        }
      } catch (err) {
        console.error(` -> Error updating Question ${questionId} for Answer ${answerId}:`, err);
        errorCount++;
      }
    }

    console.log('\n--- Fix Summary ---');
    console.log(`Total answers processed: ${allAnswers.length}`);
    console.log(`Question links checked/updated: ${updatedCount}`);
    console.log(`Skipped (no question ID or question not found): ${skippedCount}`);
    console.log(`Errors during update: ${errorCount}`);

  } catch (error) {
    console.error('An error occurred during the script execution:', error);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
}

fixAnswerLinks();
