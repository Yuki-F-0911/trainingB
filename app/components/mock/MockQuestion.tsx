'use client';

import { useEffect } from 'react';
import { Container, Box, Heading, Text, Badge, Flex, Avatar, Button } from '@chakra-ui/react';
import NextLink from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * モック質問データを生成するためのコンポーネント
 * APIが利用できない場合やテスト時に使用
 */
export default function MockQuestion({ id = 'test' }: { id?: string }) {
  useEffect(() => {
    console.log('MockQuestion: モック質問コンポーネントがレンダリングされました。', { id });
  }, [id]);

  // モックデータを生成
  const mockData = {
    id: id || 'test',
    title: 'マラソン初心者のためのトレーニング計画',
    content: `マラソンを始めたばかりです。どのようにトレーニングを進めるべきか悩んでいます。
最初は何キロから走り始めて、どのように距離を伸ばしていくのがベストでしょうか？
また、週に何回走るのが適切ですか？初心者向けのトレーニング計画があれば教えてください。`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    userId: 'test-user',
    tags: ['マラソン', '初心者', 'トレーニング'],
    isAIGenerated: true,
    personality: '市民ランナー',
    author: {
      name: 'テストユーザー',
    },
    _count: { answers: 0 }
  };

  const formattedDate = formatDistanceToNow(new Date(mockData.createdAt), { 
    addSuffix: true,
    locale: ja 
  });

  return (
    <Container maxW="container.md" py={10}>
      <Box mb={8}>
        <Box mb={4} p={2} bg="yellow.100" borderRadius="md">
          <Text fontSize="sm" color="yellow.800">
            ⚠️ これはモックデータです。APIが利用できないためテスト表示しています。
          </Text>
        </Box>

        <Flex mb={4} wrap="wrap" gap={2}>
          {mockData.isAIGenerated && (
            <Badge colorScheme="purple">AI生成</Badge>
          )}
          {mockData.personality && (
            <Badge colorScheme="teal">{mockData.personality}</Badge>
          )}
          {mockData.tags && mockData.tags.map(tag => (
            <Badge key={tag} colorScheme="blue" mr={2}>{tag}</Badge>
          ))}
        </Flex>
        
        <Heading as="h1" size="xl" mb={4}>{mockData.title}</Heading>
        
        <Text color="gray.600" mb={6}>{formattedDate}</Text>
        
        <Box 
          bg="white" 
          p={6} 
          borderRadius="md" 
          shadow="md"
          mb={8}
          whiteSpace="pre-wrap"
        >
          {mockData.content}
        </Box>

        <Flex justifyContent="space-between" mt={6} alignItems="center">
          <Flex alignItems="center">
            <Avatar size="sm" mr={2} name={mockData.author?.name || 'ユーザー'} />
            <Text fontSize="sm">{mockData.author?.name || 'テストユーザー'}</Text>
          </Flex>
        </Flex>
        
        <Flex justify="space-between" align="center" mt={6}>
          <Button 
            as={NextLink} 
            href="/questions" 
            variant="outline"
          >
            質問一覧に戻る
          </Button>
          
          <Button 
            as={NextLink} 
            href={`/questions/${mockData.id}/answer`} 
            colorScheme="blue"
          >
            回答する
          </Button>
        </Flex>
      </Box>
      
      <Box>
        <Heading as="h2" size="lg" mb={4}>
          回答 ({mockData._count?.answers || 0})
        </Heading>
        
        <Box p={4} bg="gray.50" borderRadius="md" textAlign="center">
          <Text>まだ回答はありません。最初の回答を投稿してみましょう！</Text>
        </Box>
      </Box>
    </Container>
  );
} 