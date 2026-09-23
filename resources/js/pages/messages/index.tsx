import { Head, Link } from '@inertiajs/react';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare } from 'lucide-react';
import Heading from '@/components/heading';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Thread {
    id: string;
    entry_id: string;
    campaign_title: string;
    other_party: { name: string };
    last_message: string | null;
    last_message_at: string | null;
    unread_count: number;
}

interface Props {
    threads: Thread[];
}

export default function MessagesIndex({ threads }: Props) {
    return (
        <>
            <Head title="Messages" />
            <div className="space-y-6 px-4 py-6">
                <Heading
                    title="Messages"
                    description="Your conversations with brands and creators."
                />

                {threads.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <MessageSquare className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">
                                No messages yet.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {threads.map((thread) => (
                            <Link
                                key={thread.id}
                                href={`/messages/entry/${thread.entry_id}`}
                                className="block"
                            >
                                <Card className="transition-colors hover:bg-accent/50">
                                    <CardContent className="flex items-center gap-4 py-4">
                                        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                                            <MessageSquare className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate font-medium">
                                                    {thread.other_party.name}
                                                </p>
                                                {thread.last_message_at && (
                                                    <span className="flex-shrink-0 text-xs text-muted-foreground">
                                                        {formatDistanceToNow(
                                                            new Date(
                                                                thread.last_message_at,
                                                            ),
                                                            {
                                                                addSuffix: true,
                                                            },
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {thread.campaign_title}
                                            </p>
                                            {thread.last_message && (
                                                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                                                    {thread.last_message}
                                                </p>
                                            )}
                                        </div>
                                        {thread.unread_count > 0 && (
                                            <Badge
                                                variant="default"
                                                className="flex-shrink-0 rounded-full"
                                            >
                                                {thread.unread_count}
                                            </Badge>
                                        )}
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
