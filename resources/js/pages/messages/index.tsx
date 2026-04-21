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
            <div className="space-y-6">
                <Heading title="Messages" description="Your conversations with brands and creators." />

                {threads.length === 0 ? (
                    <Card>
                        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                            <MessageSquare className="text-muted-foreground mb-4 h-12 w-12" />
                            <p className="text-muted-foreground text-sm">No messages yet.</p>
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
                                        <div className="bg-primary/10 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full">
                                            <MessageSquare className="text-primary h-5 w-5" />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="truncate font-medium">{thread.other_party.name}</p>
                                                {thread.last_message_at && (
                                                    <span className="text-muted-foreground flex-shrink-0 text-xs">
                                                        {formatDistanceToNow(new Date(thread.last_message_at), {
                                                            addSuffix: true,
                                                        })}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-muted-foreground truncate text-sm">
                                                {thread.campaign_title}
                                            </p>
                                            {thread.last_message && (
                                                <p className="text-muted-foreground mt-0.5 truncate text-xs">
                                                    {thread.last_message}
                                                </p>
                                            )}
                                        </div>
                                        {thread.unread_count > 0 && (
                                            <Badge variant="default" className="flex-shrink-0 rounded-full">
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
