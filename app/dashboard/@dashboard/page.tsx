'use client';

import { Box, VStack, Heading, List, ListItem, Link } from '@chakra-ui/react';
import NextLink from 'next/link';

export default function DashboardSidebar() {
  return (
    <Box 
      p={4} 
      bg="gray.50" 
      borderRadius="md" 
      shadow="sm"
      height="100%"
    >
      <VStack spacing={4} align="stretch">
        <Heading size="md">ダッシュボード</Heading>
        
        <List spacing={2}>
          <ListItem>
            <Link as={NextLink} href="/dashboard">
              ホーム
            </Link>
          </ListItem>
          <ListItem>
            <Link as={NextLink} href="/dashboard/stats">
              統計
            </Link>
          </ListItem>
          <ListItem>
            <Link as={NextLink} href="/dashboard/settings">
              設定
            </Link>
          </ListItem>
        </List>
      </VStack>
    </Box>
  );
} 