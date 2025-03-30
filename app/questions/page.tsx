'use client';

import { useEffect, useState } from 'react';
import { Box, Heading, Text, SimpleGrid, Container, Button, useToast } from '@chakra-ui/react';
import QuestionCard from '../components/question/QuestionCard';
import axios from '../lib/axios';
import { Question } from '../models/interfaces';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '質問一覧 | トレーニング掲示板',
  description: 'マラソンを中心とする市民ランナーのトレーニングに関する質問一覧',
};

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const toast = useToast();

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      console.log('質問データを取得中...');
      const response = await axios.get('/questions');
      console.log('質問データ取得結果:', response.data);
      setQuestions(response.data.questions || []);
    } catch (error) {
      console.error('質問取得エラー:', error);
      setError('質問の取得に失敗しました。再度お試しください。');
      toast({
        title: 'エラー',
        description: '質問の取得に失敗しました',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  // 質問データをロード中の表示
  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" mb={6}>質問一覧</Heading>
        <Text>質問データを読み込み中...</Text>
      </Container>
    );
  }

  // エラー発生時の表示
  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" mb={6}>質問一覧</Heading>
        <Text color="red.500">{error}</Text>
        <Button mt={4} onClick={fetchQuestions}>再読み込み</Button>
      </Container>
    );
  }

  // AI生成質問の有無を確認
  const hasAIQuestions = questions.some(q => q.isAIGenerated);

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8} display="flex" justifyContent="space-between" alignItems="center">
        <Heading as="h1">質問一覧</Heading>
        <Button colorScheme="blue" onClick={fetchQuestions}>更新</Button>
      </Box>

      {questions.length === 0 ? (
        <Text>質問はまだありません。最初の質問を投稿してみましょう！</Text>
      ) : (
        <>
          {/* AI生成質問の表示 */}
          {hasAIQuestions && (
            <Box mb={8}>
              <Heading as="h2" size="md" mb={4}>AI生成質問</Heading>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {questions
                  .filter(q => q.isAIGenerated)
                  .map(question => (
                    <QuestionCard key={question.id} question={question} />
                  ))}
              </SimpleGrid>
            </Box>
          )}

          {/* ユーザー投稿質問の表示 */}
          <Box>
            <Heading as="h2" size="md" mb={4}>ユーザー投稿質問</Heading>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {questions
                .filter(q => !q.isAIGenerated)
                .map(question => (
                  <QuestionCard key={question.id} question={question} />
                ))}
            </SimpleGrid>
          </Box>
        </>
      )}
    </Container>
  );
} 