'use client';

import { useEffect, useState } from 'react';
import { Box, Heading, Text, SimpleGrid, Container, Button, useToast, Spinner, Center, HStack, IconButton } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';
import QuestionCard from '../components/question/QuestionCard';
import axios from '../lib/axios';
import { Question } from '../models/interfaces';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pollingCount, setPollingCount] = useState(0);
  const toast = useToast();

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      console.log(`質問データを取得中... ページ: ${page}`);
      
      // 公式APIサーバーから質問データを取得
      const response = await axios.get(`/questions?page=${page}&limit=9`);
      console.log('質問データ取得結果:', response.data);
      
      // APIレスポンスを適切に処理
      if (response.data && Array.isArray(response.data.questions)) {
        setQuestions(response.data.questions);
        setTotalPages(response.data.totalPages || 1);
        setCurrentPage(page);
      } else if (response.data && Array.isArray(response.data)) {
        // APIがフラットな配列を返す場合の処理
        setQuestions(response.data);
        setTotalPages(Math.ceil(response.data.length / 9));
        setCurrentPage(page);
      } else {
        throw new Error('予期しない応答形式です');
      }
    } catch (error: any) {
      console.error('質問取得エラー:', error);
      setError('質問の取得に失敗しました。再度お試しください。');
      toast({
        title: 'エラー',
        description: error.response?.data?.message || error.message || '質問の取得に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  // ポーリングによるデータ更新 (AI質問生成後に使用)
  const pollForNewQuestions = (initialCount = 0, maxAttempts = 3, interval = 3000) => {
    setPollingCount(initialCount);
    
    const poll = () => {
      console.log(`データポーリング実行中... 試行回数: ${initialCount + 1}/${maxAttempts}`);
      fetchQuestions(1);
      
      if (initialCount < maxAttempts - 1) {
        setTimeout(() => {
          setPollingCount(initialCount + 1);
          poll();
        }, interval);
      } else {
        console.log('ポーリング完了');
        setPollingCount(0);
      }
    };
    
    poll();
  };

  // 手動でAI質問を生成する関数
  const generateAIQuestion = async () => {
    try {
      setLoading(true);
      // /api プレフィックスを削除して正しいサーバーAPIのパスを使用
      const response = await axios.post('/ai/webhook', {
        secret: process.env.NEXT_PUBLIC_WEBHOOK_SECRET || 'zf&c;IXyflo/b'
      });
      
      toast({
        title: '成功',
        description: 'AI質問リクエストを送信しました。生成完了までしばらくお待ちください。',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // 最初のデータ取得を行い、その後ポーリングを開始
      fetchQuestions(1).then(() => {
        // 3秒間隔で3回ポーリングを行う
        pollForNewQuestions(0, 3, 3000);
      });
    } catch (error: any) {
      console.error('AI質問生成エラー:', error);
      toast({
        title: 'エラー',
        description: error.response?.data?.message || error.message || 'AI質問の生成に失敗しました',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      // 必ずローディング状態を解除
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions(currentPage);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchQuestions(newPage);
  };

  // 質問データをロード中の表示
  if (loading && !pollingCount) {
    return (
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" mb={6}>質問一覧</Heading>
        <Center py={10}>
          <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
          <Text ml={4}>質問データを読み込み中...</Text>
        </Center>
      </Container>
    );
  }

  // エラー発生時の表示
  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Heading as="h1" mb={6}>質問一覧</Heading>
        <Text color="red.500" mb={4}>{error}</Text>
        <Button colorScheme="blue" onClick={() => fetchQuestions(1)}>再読み込み</Button>
      </Container>
    );
  }

  // AI生成質問の有無を確認
  const hasAIQuestions = questions.some(q => q.isAIGenerated);
  const hasUserQuestions = questions.some(q => !q.isAIGenerated);

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8} display="flex" justifyContent="space-between" alignItems="center">
        <Heading as="h1">質問一覧</Heading>
        <HStack spacing={3}>
          <Button colorScheme="purple" onClick={generateAIQuestion} isLoading={loading} isDisabled={pollingCount > 0}>
            {pollingCount > 0 ? `データ更新中 (${pollingCount}/3)` : 'AI質問生成'}
          </Button>
          <Button colorScheme="blue" onClick={() => fetchQuestions(currentPage)} isLoading={loading} isDisabled={pollingCount > 0}>
            更新
          </Button>
        </HStack>
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
          {hasUserQuestions && (
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
          )}

          {/* ページネーション */}
          {totalPages > 1 && (
            <Center mt={8}>
              <HStack spacing={2}>
                <IconButton
                  aria-label="前のページへ"
                  icon={<ChevronLeftIcon />}
                  onClick={() => handlePageChange(currentPage - 1)}
                  isDisabled={currentPage <= 1 || pollingCount > 0}
                  variant="outline"
                />
                
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "solid" : "outline"}
                    colorScheme={currentPage === i + 1 ? "blue" : "gray"}
                    onClick={() => handlePageChange(i + 1)}
                    isDisabled={pollingCount > 0}
                  >
                    {i + 1}
                  </Button>
                ))}
                
                <IconButton
                  aria-label="次のページへ"
                  icon={<ChevronRightIcon />}
                  onClick={() => handlePageChange(currentPage + 1)}
                  isDisabled={currentPage >= totalPages || pollingCount > 0}
                  variant="outline"
                />
              </HStack>
            </Center>
          )}
        </>
      )}
    </Container>
  );
} 