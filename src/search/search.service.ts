import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { SubscriptionsService } from "../subscriptions/subscriptions.service";

type DuckDuckGoTopic = {
  FirstURL?: string;
  Text?: string;
  Topics?: DuckDuckGoTopic[];
};

@Injectable()
export class SearchService {
  constructor(
    private prisma: PrismaService,
    private subscriptions: SubscriptionsService,
  ) {}

  private flattenTopics(topics: DuckDuckGoTopic[]): DuckDuckGoTopic[] {
    return topics.flatMap((topic) =>
      topic.Topics?.length ? this.flattenTopics(topic.Topics) : [topic],
    );
  }

  private async publicSearch(query: string) {
    const url = new URL("https://api.duckduckgo.com/");
    url.searchParams.set("q", query);
    url.searchParams.set("format", "json");
    url.searchParams.set("no_html", "1");
    url.searchParams.set("no_redirect", "1");
    url.searchParams.set("skip_disambig", "1");

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return [];

    const data = (await response.json()) as {
      AbstractText?: string;
      AbstractURL?: string;
      Heading?: string;
      RelatedTopics?: DuckDuckGoTopic[];
    };
    const results: Array<{
      title: string;
      url: string;
      description?: string;
    }> = this.flattenTopics(data.RelatedTopics || [])
      .filter((topic) => topic.FirstURL && topic.Text)
      .slice(0, 10)
      .map((topic) => ({ title: topic.Text!, url: topic.FirstURL! }));

    if (data.AbstractText && data.AbstractURL) {
      results.unshift({
        title: data.Heading || data.AbstractText,
        url: data.AbstractURL,
        description: data.AbstractText,
      });
    }
    return results;
  }

  async search(userId: string, query: string) {
    await this.subscriptions.assertAvailable(userId);
    const cached = await this.prisma.webSearch.findFirst({
      where: {
        userId,
        query,
        createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
      },
      orderBy: { createdAt: "desc" },
    });
    if (cached) return { cached: true, results: cached.results };
    const results = await this.publicSearch(query).catch(() => []);
    await this.prisma.webSearch.create({ data: { userId, query, results } });
    return { cached: false, results };
  }
  history(userId: string) {
    return this.prisma.webSearch.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }
  recent(userId: string) {
    return this.prisma.webSearch.findMany({
      where: { userId },
      distinct: ["query"],
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { query: true, createdAt: true },
    });
  }
  async suggestions(userId: string, q: string) {
    const rows = await this.prisma.webSearch.findMany({
      where: { userId, query: { contains: q, mode: "insensitive" } },
      distinct: ["query"],
      take: 8,
      select: { query: true },
    });
    return rows.map((r) => r.query);
  }
}
