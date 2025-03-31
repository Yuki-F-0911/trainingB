'use client';

import { useEffect, useState } from 'react';
import { Box, Heading, Text, Container } from '@chakra-ui/react';

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // ダッシュボードデータの読み込みをシミュレート
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <Container>
        <Box textAlign="center" py={10}>
          <Text>読み込み中...</Text>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <Box py={8}>
        <Heading as="h1" mb={6}>ダッシュボード</Heading>
        <Text>ここにダッシュボードのコンテンツが表示されます。</Text>
      </Box>
    </Container>
  );
} 