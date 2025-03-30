'use client';

import { Box, Heading, Text, Container, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText, Card, CardBody } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import axios from 'axios';

interface DashboardStats {
  totalQuestions: number;
  totalAnswers: number;
  totalUsers: number;
  aiGeneratedContent: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalQuestions: 0,
    totalAnswers: 0,
    totalUsers: 0,
    aiGeneratedContent: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // ダミーデータを使用（APIが実装されるまで）
    // 実際のデータはAPIから取得する予定
    setTimeout(() => {
      setStats({
        totalQuestions: 42,
        totalAnswers: 128,
        totalUsers: 15,
        aiGeneratedContent: 36
      });
      setLoading(false);
    }, 500);
  }, []);

  if (error) {
    return (
      <Container maxW="container.xl" py={10}>
        <Heading as="h1" mb={6}>ダッシュボード</Heading>
        <Text color="red.500">{error}</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={10}>
      <Heading as="h1" mb={6}>ダッシュボード</Heading>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={10}>
        <StatCard
          label="質問総数"
          value={stats.totalQuestions}
          helpText="トレーニングボードに投稿された質問数"
          isLoading={loading}
        />
        <StatCard
          label="回答総数"
          value={stats.totalAnswers}
          helpText="トレーニングボードに投稿された回答数"
          isLoading={loading}
        />
        <StatCard
          label="ユーザー数"
          value={stats.totalUsers}
          helpText="登録済みユーザー数"
          isLoading={loading}
        />
        <StatCard
          label="AI生成コンテンツ"
          value={stats.aiGeneratedContent}
          helpText="AIが生成した質問と回答の数"
          isLoading={loading}
        />
      </SimpleGrid>

      <Box textAlign="center" mt={10}>
        <Text fontSize="sm" color="gray.500">
          ※ 現在はダミーデータを表示しています。
        </Text>
      </Box>
    </Container>
  );
}

interface StatCardProps {
  label: string;
  value: number;
  helpText: string;
  isLoading: boolean;
}

function StatCard({ label, value, helpText, isLoading }: StatCardProps) {
  return (
    <Card shadow="md" borderRadius="lg">
      <CardBody>
        <Stat>
          <StatLabel fontSize="md">{label}</StatLabel>
          <StatNumber fontSize="2xl" fontWeight="bold">
            {isLoading ? '読込中...' : value}
          </StatNumber>
          <StatHelpText fontSize="xs">{helpText}</StatHelpText>
        </Stat>
      </CardBody>
    </Card>
  );
} 