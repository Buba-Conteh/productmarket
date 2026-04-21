import { Head, Link, useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Message {
    id: string;
    body: string;
    sender_id: string;
    sender_name: string;
    sender_avatar: string | null;
    is_mine: boolean;
    read_at: string | null;
    created_at: string;
}

interface Thread {
    id: string;
    entry_id: string;
    campaign_title: string;
    other_party: { name: string };
}

interface Props {
    thread: Thread;
    messages: Message[];
    auth_user_id: string;
}

export default function MessagesShow({ thread, messages: initialMessages, auth_user_id }: Props) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const bottomRef = useRef<HTMLDivElement>(null);
    const { data, setData, post, processing, reset } = useForm({ body: '' });

    // Scroll to bottom on load and new messages
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Listen for real-time messages via Reverb
    useEffect(() => {
        const echo = (window as any).Echo;
        if (!echo) return;

        const channel = echo.private(`thread.${thread.id}`);
        channel.listen('.message.sent', (event: Message) => {
            if (event.sender_id !== auth_user_id) {
                setMessages((prev) => [...prev, event]);
            }
        });

        return () => {
            echo.leave(`thread.${thread.id}`);
        };
    }, [thread.id, auth_user_id]);

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!data.body.trim()) return;

        const optimistic: Message = {
            id: `temp-${Date.now()}`,
            body: data.body,
            sender_id: auth_user_id,
            sender_name: 'You',
            sender_avatar: null,
            is_mine: true,
            read_at: null,
            created_at: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, optimistic]);
        reset('body');

        post(`/messages/${thread.id}`, {
            preserveScroll: true,
            onError: () => {
                setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
            },
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            submit(e as any);
        }
    };

    return (
        <>
            <Head title={`Chat — ${thread.other_party.name}`} />
            <div className="flex h-[calc(100vh-8rem)] flex-col">
                {/* Header */}
                <div className="border-b px-4 py-3">
                    <div className="flex items-center gap-3">
                        <Link href="/messages" className="text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-5 w-5" />
                        </Link>
                        <div>
                            <p className="font-semibold">{thread.other_party.name}</p>
                            <p className="text-muted-foreground text-xs">{thread.campaign_title}</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                    {messages.length === 0 && (
                        <p className="text-muted-foreground py-8 text-center text-sm">
                            No messages yet. Start the conversation.
                        </p>
                    )}
                    {messages.map((message) => (
                        <div
                            key={message.id}
                            className={cn('flex gap-2', message.is_mine ? 'flex-row-reverse' : 'flex-row')}
                        >
                            <div
                                className={cn(
                                    'max-w-[75%] rounded-2xl px-4 py-2.5 text-sm',
                                    message.is_mine
                                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                                        : 'bg-muted rounded-bl-sm',
                                )}
                            >
                                <p className="whitespace-pre-wrap">{message.body}</p>
                                <p
                                    className={cn(
                                        'mt-1 text-right text-[10px]',
                                        message.is_mine ? 'text-primary-foreground/60' : 'text-muted-foreground',
                                    )}
                                >
                                    {format(new Date(message.created_at), 'h:mm a')}
                                </p>
                            </div>
                        </div>
                    ))}
                    <div ref={bottomRef} />
                </div>

                {/* Composer */}
                <div className="border-t px-4 py-3">
                    <form onSubmit={submit} className="flex gap-2">
                        <Textarea
                            value={data.body}
                            onChange={(e) => setData('body', e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Type a message… (Enter to send, Shift+Enter for newline)"
                            rows={2}
                            className="flex-1 resize-none"
                            disabled={processing}
                        />
                        <Button type="submit" size="icon" disabled={processing || !data.body.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </>
    );
}
