import {
  ActionIcon,
  Avatar,
  Box,
  Center,
  Container,
  Divider,
  Group,
  Paper,
  Popover,
  ScrollArea,
  SimpleGrid,
  Skeleton,
  Stack,
  Table,
  Text,
  Textarea,
  UnstyledButton
} from '@mantine/core';
import { IconSend, IconSparkles } from '@tabler/icons-react';
import dayjs from 'dayjs';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import { useLoaderData, useNavigate } from 'react-router';
import remarkGfm from 'remark-gfm';
import { requireBetterAuthUser } from '~/app/services/better-auth.server';
import classes from './assistant.module.css';

export async function loader({ request }: any) {
  const user = await requireBetterAuthUser(request);
  return { user };
}

export function meta() {
  return [
    { title: "AI Assistant - InventoryPro" },
    { name: "description", content: "AI assistant for inventory management and general conversation" },
  ];
}

// Simple markdown components with clean styling and good contrast
const MarkdownComponents = {
  h1: ({ children, ...props }: any) => (
    <Text size="xl" fw={700} mb="md" {...props}>
      {children}
    </Text>
  ),
  h2: ({ children, ...props }: any) => (
    <Text size="lg" fw={600} mb="sm" mt="lg" {...props}>
      {children}
    </Text>
  ),
  h3: ({ children, ...props }: any) => (
    <Text size="md" fw={600} mb="sm" mt="md" {...props}>
      {children}
    </Text>
  ),
  p: ({ children, ...props }: any) => (
    <Text size="sm" mb="sm" className={classes.markdownP} {...props}>
      {children}
    </Text>
  ),
  strong: ({ children, ...props }: any) => (
    <Text span fw={700} {...props}>
      {children}
    </Text>
  ),
  em: ({ children, ...props }: any) => (
    <Text span fs="italic" c="dimmed" {...props}>
      {children}
    </Text>
  ),
  ul: ({ children, ...props }: any) => (
    <Box component="ul" pl="md" mb="sm" {...props}>
      {children}
    </Box>
  ),
  ol: ({ children, ...props }: any) => (
    <Box component="ol" pl="md" mb="sm" {...props}>
      {children}
    </Box>
  ),
  li: ({ children, ...props }: any) => (
    <Text component="li" size="sm" mb={4} className={classes.markdownLi} {...props}>
      {children}
    </Text>
  ),
  blockquote: ({ children, ...props }: any) => (
    <Box
      pl="md"
      mb="sm"
      className={classes.markdownBlockquote}
      {...props}
    >
      <Text size="sm" fs="italic" c="dimmed">
        {children}
      </Text>
    </Box>
  ),
  code: ({ children, className, ...props }: any) => {
    const isInline = !className;

    if (isInline) {
      return (
        <Text
          span
          className={classes.markdownInlineCode}
          {...props}
        >
          {children}
        </Text>
      );
    }

    return (
      <Box
        p="md"
        mb="sm"
        className={classes.markdownCodeBlock}
        {...props}
      >
        <Text className={classes.markdownCodeText}>
          {children}
        </Text>
      </Box>
    );
  },
  table: ({ children, ...props }: any) => (
    <Box mb="lg" className={classes.markdownTable}>
      <Table className={classes.markdownTableInner} {...props}>
        {children}
      </Table>
    </Box>
  ),
  thead: ({ children, ...props }: any) => (
    <Table.Thead className={classes.markdownThead} {...props}>
      {children}
    </Table.Thead>
  ),
  tbody: ({ children, ...props }: any) => (
    <Table.Tbody {...props}>
      {children}
    </Table.Tbody>
  ),
  tr: ({ children, ...props }: any) => (
    <Table.Tr {...props}>
      {children}
    </Table.Tr>
  ),
  th: ({ children, ...props }: any) => (
    <Table.Th className={classes.markdownTh} {...props}>
      {children}
    </Table.Th>
  ),
  td: ({ children, ...props }: any) => (
    <Table.Td className={classes.markdownTd} {...props}>
      {children}
    </Table.Td>
  ),
  hr: ({ ...props }: any) => (
    <Divider my="lg" className={classes.markdownHr} {...props} />
  )
};

// All AI logic is now handled by the streaming route to avoid duplication

// UI now only uses streaming - no server action needed

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isStreaming?: boolean;
}

export default function Chat() {
  const { t } = useTranslation(['assistant', 'common']);
  // Add some test messages to demonstrate scrolling
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showCommandPopover, setShowCommandPopover] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useLoaderData<typeof loader>();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Available chat commands
  const availableCommands = [
    {
      command: '/clear',
      description: t('assistant:clearChat'),
      icon: '🧹'
    },
    {
      command: '/help',
      description: t('assistant:showHelp'),
      icon: '❓'
    }
  ];

  // Handle command selection from popover
  const handleCommandSelect = (command: string) => {
    setShowCommandPopover(false);
    // Immediately execute the command instead of showing it in the input
    handleChatCommand(command);
  };

  // Utility function to handle chat commands
  const handleChatCommand = (command: string): boolean => {
    const trimmedCommand = command.trim().toLowerCase();

    switch (trimmedCommand) {
      case '/clear':
        setMessages([]);
        return true; // Command was handled

      case '/help':
        const helpMessage: Message = {
          id: Date.now().toString() + '-help',
          content: `${t('assistant:commandsHeader')}\n\n${availableCommands.map(cmd => `${cmd.icon} **${cmd.command}** - ${cmd.description}`).join('\n')}`,
          role: 'assistant',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, helpMessage]);
        return true; // Command was handled

      default:
        return false; // Command not recognized
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    // Check if the input is a command
    if (inputValue.trim().startsWith('/')) {
      const wasHandled = handleChatCommand(inputValue);
      if (wasHandled) {
        setInputValue('');
        return;
      }
    }

    // Add user message immediately to show it was submitted
    const userMessage: Message = {
      id: Date.now().toString() + '-user',
      content: inputValue,
      role: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);

    // Start sending message
    sendMessage(inputValue);
    setInputValue('');
    setShowCommandPopover(false); // Hide popover on submit
  };

  // Regular fetch function (replaces streaming)
  const sendMessage = async (message: string) => {
    setIsLoading(true);

    // Create an assistant message with loading state
    const assistantMessageId = Date.now().toString() + '-assistant';
    const assistantMessage: Message = {
      id: assistantMessageId,
      content: '',
      role: 'assistant',
      timestamp: new Date(),
      isStreaming: true
    };

    setMessages(prev => [...prev, assistantMessage]);

    try {
      const formData = new FormData();
      formData.append('message', message);

      const response = await fetch('/assistant/chat', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Update message with final content
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              content: data.content || t('assistant:noResponseGenerated'),
              isStreaming: false
            }
            : msg
        ));
      } else {
        // Handle error response
        setMessages(prev => prev.map(msg =>
          msg.id === assistantMessageId
            ? {
              ...msg,
              content: data.error || t('assistant:failedToGetResponse'),
              isStreaming: false
            }
            : msg
        ));
      }

    } catch (error) {
      console.error('Error sending message:', error);

      setMessages(prev => prev.map(msg =>
        msg.id === assistantMessageId
          ? {
            ...msg,
            content: t('assistant:failedToGetResponse'),
            isStreaming: false
          }
          : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Format tool results for display
  const formatToolResult = (toolName: string, result: any): string => {
    switch (toolName) {
      case 'get_all_products':
        return `Found ${result.products?.length || 0} products`;

      case 'get_current_time':
        return `Current time: ${result.current_time}`;

      default:
        return JSON.stringify(result, null, 2);
    }

  };

  // Handle input change and show/hide popover for commands
  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setInputValue(value);

    // Show popover when user types '/' at the beginning
    if (value === '/') {
      setShowCommandPopover(true);
    } else if (!value.startsWith('/') || value.includes(' ')) {
      setShowCommandPopover(false);
    }
  };



  const formatTimestamp = (date: Date) => {
    const messageDate = dayjs(date);
    const now = dayjs();

    if (messageDate.isSame(now, 'day')) {
      // Today - show time only
      return messageDate.format('h:mm A');
    } else if (messageDate.isSame(now.subtract(1, 'day'), 'day')) {
      // Yesterday
      return t('assistant:yesterday');
    } else {
      // Other days - show date
      if (messageDate.isSame(now, 'year')) {
        return messageDate.format('MMM D');
      } else {
        return messageDate.format('MMM D, YYYY');
      }
    }
  };

  const shouldShowTimestamp = (currentMessage: Message, previousMessage?: Message) => {
    if (!previousMessage) return true;

    const currentTime = dayjs(currentMessage.timestamp);
    const previousTime = dayjs(previousMessage.timestamp);

    // Show timestamp if messages are more than 5 minutes apart
    return currentTime.diff(previousTime, 'minute') > 5;
  };

  const currentHour = dayjs().hour();

  const exampleQuestions = [
    {
      title: t('assistant:showAllProducts'),
      icon: "📦"
    },
    {
      title: t('assistant:searchProducts'),
      icon: "🔍"
    },
    {
      title: t('assistant:getReorderRecommendations'),
      icon: "📊"
    },
    {
      title: t('assistant:generateDemandForecast'),
      icon: "🔮"
    },
    {
      title: t('assistant:runAnomalyDetection'),
      icon: "🚨"
    },
    {
      title: t('assistant:businessInsights'),
      icon: "💡"
    },
    {
      title: t('assistant:analyzeProductPerformance'),
      icon: "📈"
    },
    {
      title: t('assistant:naturalQuestions'),
      icon: "💰"
    },
    {
      title: t('assistant:stockLevels'),
      icon: "⚠️"
    },
    {
      title: t('assistant:optimizationRecommendations'),
      icon: "🎯"
    }
  ];

  return (
    <Box className={classes.chatContainer}>
      {messages.length === 0 ? (
        <Container size="md" h="100%" p={0}>
          <Center h="100%">
            <Stack align="center" gap="xl" >
              <Box ta="center">
                <IconSparkles size={64} color="var(--mantine-color-blue-6)" style={{ marginBottom: '1rem' }} />
                <Text size="xl" fw={600} mb="xs">
                  {currentHour < 12 ? t('assistant:goodMorning') : currentHour < 18 ? t('assistant:goodAfternoon') : t('assistant:goodEvening')}
                </Text>
                <Text size="md" c="dimmed" ta="center" lh={1.5}>
                  {t('assistant:welcomeMessage')}
                </Text>
              </Box>

              <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm" w="100%">
                {exampleQuestions.map((question, index) => (
                  <UnstyledButton
                    key={index}
                    className={classes.exampleCard}
                    onClick={() => setInputValue(question.title)}
                  >
                    <Group gap="sm" align="center">
                      <Text size="lg">{question.icon}</Text>
                      <Text size="sm" c="dimmed" fw={500}>
                        {question.title}
                      </Text>
                    </Group>
                  </UnstyledButton>
                ))}
              </SimpleGrid>
            </Stack>
          </Center>
        </Container>
      ) : (
        /* Messages */
        <ScrollArea
          ref={scrollRef}
          className={classes.messagesScrollArea}
        >
          <Stack gap="lg">
            {messages.map((message, index) => {
              const previousMessage = index > 0 ? messages[index - 1] : undefined;
              const showTimestamp = shouldShowTimestamp(message, previousMessage);

              return (
                <Box key={message.id}>
                  {showTimestamp && (
                    <Text size="xs" c="dimmed" ta="center" mb="md">
                      {formatTimestamp(message.timestamp)}
                    </Text>
                  )}

                  <Group
                    align="flex-start"
                    gap="md"
                  >
                    <Avatar
                      size="md"
                      radius="xl"
                      color={message.role === 'user' ? 'blue' : 'grape'}
                      src={message.role === 'user' ? (user.image || user.profile?.avatar || undefined) : undefined}
                      name={message.role === 'user' ?
                        `${user.profile?.firstName?.charAt(0) || 'U'}${user.profile?.lastName?.charAt(0) || ''}` :
                        undefined
                      }
                    >
                      {message.role === 'user' ? (
                        // Show initials if no image, otherwise Avatar will show the image
                        !user.image && !user.profile?.avatar ? (
                          `${user.profile?.firstName?.charAt(0) || 'U'}${user.profile?.lastName?.charAt(0) || ''}`
                        ) : null
                      ) : (
                        <IconSparkles size={16} />
                      )}
                    </Avatar>

                    <Box flex={1} maw="100%">
                      {message.role === 'assistant' ? (
                        <Box>
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={MarkdownComponents}
                          >
                            {message.content || (message.isStreaming ? '' : t('assistant:noResponseGenerated'))}
                          </ReactMarkdown>
                          {message.isStreaming && !message.content && (
                            <Stack gap="xs">
                              <Skeleton height={8} radius="xl" />
                              <Skeleton height={8} width="70%" radius="xl" />
                              <Skeleton height={8} width="40%" radius="xl" />
                            </Stack>
                          )}
                        </Box>
                      ) : (
                        <Text size="sm">
                          {message.content}
                        </Text>
                      )}
                    </Box>
                  </Group>
                </Box>
              );
            })}
          </Stack>

        </ScrollArea>
      )}
      {/* Input Area - Absolute positioned within container */}
      <Popover
        opened={showCommandPopover}
        onClose={() => setShowCommandPopover(false)}
        position="top-start"
        withinPortal
      >
        <Popover.Target>
          <Paper radius="md" withBorder p="md">
            <form onSubmit={handleSubmit}>
              <Group gap="sm" align="flex-end">
                <Textarea
                  placeholder={isLoading ? t('assistant:pleaseWait') : t('assistant:askMeAnything')}
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={isLoading}
                  autosize
                  minRows={1}
                  maxRows={6}
                  variant="unstyled"
                  size="sm"
                  className={classes.messageInput}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  style={{ flex: 1 }}
                />
                <ActionIcon
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  variant="filled"
                  color="blue"
                  size="lg"
                  radius="xl"
                  loading={isLoading}
                  className={classes.sendButton}
                >
                  {!isLoading && <IconSend size={18} />}
                </ActionIcon>
              </Group>
            </form>
          </Paper>
        </Popover.Target>

        <Popover.Dropdown>
          <Stack gap="xs">
            <Text size="xs" fw={600} c="dimmed" mb="xs">
              {t('assistant:availableCommands')}
            </Text>
            {availableCommands.map((cmd) => (
              <UnstyledButton
                key={cmd.command}
                onClick={() => handleCommandSelect(cmd.command)}
                className={classes.commandOption}
              >
                <Group gap="sm">
                  <Text size="sm">{cmd.icon}</Text>
                  <div>
                    <Text size="sm" fw={500}>
                      {cmd.command}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {cmd.description}
                    </Text>
                  </div>
                </Group>
              </UnstyledButton>
            ))}
          </Stack>
        </Popover.Dropdown>
      </Popover>
      <Text size="xs" c="dimmed" ta="center" mt="xs">
        {t('assistant:pressEnterToSend')}
      </Text>
    </Box >
  );
}
