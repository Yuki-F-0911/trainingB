'use client';

import { Box, Heading, Text, Badge, Flex, Icon, Link } from '@chakra-ui/react';
import NextLink from 'next/link';
import { ChatIcon } from '@chakra-ui/icons';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';
import { Question } from '@/app/models/interfaces';

interface QuestionCardProps {
  question: Question;
}

export default function QuestionCard({ question }: QuestionCardProps) {
  const formattedDate = formatDistanceToNow(new Date(question.createdAt), { 
    addSuffix: true,
    locale: ja 
  });

  return (
    <Box 
      as={NextLink}
      href={`/questions/${question.id}`}
      p={5} 
      shadow="md" 
      borderWidth="1px" 
      borderRadius="lg"
      _hover={{ 
        shadow: 'lg',
        borderColor: 'blue.300',
        transform: 'translateY(-2px)',
        transition: 'all 0.2s ease-in-out'
      }}
      transition="all 0.2s ease-in-out"
      bg="white"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      <Flex mb={2} wrap="wrap" gap={2}>
        {question.isAIGenerated && (
          <Badge colorScheme="purple" mr={2}>AI生成</Badge>
        )}
        {question.personality && (
          <Badge colorScheme="teal">{question.personality}</Badge>
        )}
        {question.tags && question.tags.map(tag => (
          <Badge key={tag} colorScheme="blue" mr={2}>{tag}</Badge>
        ))}
      </Flex>
      
      <Heading fontSize="xl" mb={2} noOfLines={2}>{question.title}</Heading>
      
      <Text noOfLines={3} mb={4} flex="1">
        {question.content}
      </Text>
      
      <Flex justifyContent="space-between" alignItems="center" fontSize="sm" color="gray.500">
        <Text>{formattedDate}</Text>
        <Flex alignItems="center">
          <Icon as={ChatIcon} mr={1} />
          <Text>{question._count?.answers || 0}</Text>
        </Flex>
      </Flex>
    </Box>
  );
} 