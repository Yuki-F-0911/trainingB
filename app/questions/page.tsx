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
  const toast = useToast();

  const fetchQuestions = async (page = 1) => {
    try {
      setLoading(true);
      setError('');
      console.log(`質問データを取得中... ページ: ${page}`);
      const response = await axios.get(`/questions?page=${page}&limit=9`);
      console.log('質問データ取得結果:', response.data);
      setQuestions(response.data.questions || []);
      setTotalPages(response.data.totalPages || 1);
      setCurrentPage(page);
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

  useEffect(() => {
    fetchQuestions(currentPage);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    fetchQuestions(newPage);
  };

  // 質問データをロード中の表示
  if (loading) {
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
        <Button colorScheme="blue" onClick={() => fetchQuestions(currentPage)}>更新</Button>
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
                  isDisabled={currentPage <= 1}
                  variant="outline"
                />
                
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? "solid" : "outline"}
                    colorScheme={currentPage === i + 1 ? "blue" : "gray"}
                    onClick={() => handlePageChange(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                
                <IconButton
                  aria-label="次のページへ"
                  icon={<ChevronRightIcon />}
                  onClick={() => handlePageChange(currentPage + 1)}
                  isDisabled={currentPage >= totalPages}
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