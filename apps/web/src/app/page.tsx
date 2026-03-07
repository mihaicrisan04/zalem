"use client";

import { useState } from "react";
import Link from "next/link";
import { SignInButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import {
	BarChart3,
	Globe,
	Lock,
	Plug,
	Rocket,
	Shield,
	Sparkles,
	Zap,
} from "lucide-react";
import { toast } from "@zalem/ui/components/optics/sonner";
import { Button } from "@zalem/ui/components/optics/button";
import { Badge } from "@zalem/ui/components/optics/badge";
import {
	Card,
	CardHeader,
	CardFooter,
	CardTitle,
	CardDescription,
	CardContent,
	CardAction,
} from "@zalem/ui/components/optics/card";
import {
	Tabs,
	TabsList,
	TabsTab,
	TabsContents,
	TabsContent,
} from "@zalem/ui/components/optics/tabs";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@zalem/ui/components/optics/accordion";
import {
	Avatar,
	AvatarFallback,
	AvatarGroup,
	AvatarGroupCount,
} from "@zalem/ui/components/optics/avatar";
import {
	Progress,
	ProgressLabel,
	ProgressValue,
} from "@zalem/ui/components/optics/progress";
import {
	Dialog,
	DialogTrigger,
	DialogPopup,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
	DialogClose,
	DialogBackdrop,
} from "@zalem/ui/components/optics/dialog";
import { Separator } from "@zalem/ui/components/optics/separator";
import { Switch } from "@zalem/ui/components/optics/switch";
import { Input } from "@zalem/ui/components/optics/input";
import { Label } from "@zalem/ui/components/optics/label";
import { Spinner } from "@zalem/ui/components/optics/spinner";
import { StarRating } from "@zalem/ui/components/optics/star-rating";
import { Kbd, KbdGroup } from "@zalem/ui/components/optics/kbd";
import {
	Tooltip,
	TooltipTrigger,
	TooltipContent,
} from "@zalem/ui/components/optics/tooltip";

// --- Hero ---

function Hero() {
	return (
		<section className="flex flex-col items-center gap-6 py-20 text-center">
			<Badge variant="outline">Now in Beta</Badge>
			<h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
				Build faster with{" "}
				<span className="text-primary">Zalem</span>
			</h1>
			<p className="max-w-2xl text-lg text-muted-foreground">
				The developer platform that gives your team superpowers. Ship
				products in days, not months.
			</p>
			<div className="flex flex-wrap items-center justify-center gap-3">
				<Authenticated>
					<Link href="/dashboard">
						<Button size="lg">Go to Dashboard</Button>
					</Link>
				</Authenticated>
				<Unauthenticated>
					<SignInButton>
						<Button size="lg">Get Started</Button>
					</SignInButton>
				</Unauthenticated>
				<AuthLoading>
					<Button size="lg" disabled>
						<Spinner size="size-4" />
					</Button>
				</AuthLoading>
				<Tooltip>
					<TooltipTrigger
						render={<Button variant="secondary" size="lg" />}
					>
						View Demo
					</TooltipTrigger>
					<TooltipContent>See it in action</TooltipContent>
				</Tooltip>
			</div>
			<KbdGroup>
				<Kbd>⌘</Kbd>
				<Kbd>K</Kbd>
			</KbdGroup>
			<p className="text-xs text-muted-foreground">
				Press to open command palette
			</p>
		</section>
	);
}

// --- Social Proof ---

function SocialProof() {
	const initials = ["JD", "SK", "MR", "AL", "TP"];
	return (
		<section className="flex flex-col items-center gap-4 py-8">
			<Separator decoration className="w-full max-w-md" />
			<div className="flex items-center gap-4">
				<AvatarGroup>
					{initials.map((i) => (
						<Avatar key={i} size="sm">
							<AvatarFallback>{i}</AvatarFallback>
						</Avatar>
					))}
					<AvatarGroupCount>+2.4k</AvatarGroupCount>
				</AvatarGroup>
				<p className="text-sm text-muted-foreground">
					Trusted by <strong>2,400+</strong> developers
				</p>
			</div>
			<Separator decoration className="w-full max-w-md" />
		</section>
	);
}

// --- Features ---

const featureData = {
	analytics: [
		{
			title: "Real-time Dashboards",
			description: "Monitor everything as it happens with live data feeds.",
			icon: BarChart3,
			badge: "Popular",
		},
		{
			title: "Custom Reports",
			description: "Build reports tailored to your workflow.",
			icon: Sparkles,
			badge: "New",
		},
	],
	integrations: [
		{
			title: "100+ Connectors",
			description: "Connect to all your favorite tools in seconds.",
			icon: Plug,
			badge: "Growing",
		},
		{
			title: "Global CDN",
			description: "Lightning-fast delivery from edge locations worldwide.",
			icon: Globe,
		},
	],
	security: [
		{
			title: "End-to-End Encryption",
			description: "Your data is encrypted at rest and in transit.",
			icon: Lock,
		},
		{
			title: "SOC 2 Compliant",
			description: "Enterprise-grade security and compliance built in.",
			icon: Shield,
			badge: "Verified",
		},
	],
};

function Features() {
	return (
		<section className="py-16">
			<h2 className="mb-8 text-center text-3xl font-bold">
				Everything you need
			</h2>
			<Tabs defaultValue="analytics">
				<TabsList className="mx-auto">
					<TabsTab value="analytics">Analytics</TabsTab>
					<TabsTab value="integrations">Integrations</TabsTab>
					<TabsTab value="security">Security</TabsTab>
				</TabsList>
				<TabsContents>
					{Object.entries(featureData).map(([key, features]) => (
						<TabsContent key={key} value={key}>
							<div className="mt-6 grid gap-4 sm:grid-cols-2">
								{features.map((f) => (
									<Card key={f.title} decorations>
										<CardHeader>
											<CardAction>
												{f.badge && (
													<Badge variant="secondary">
														{f.badge}
													</Badge>
												)}
											</CardAction>
											<CardTitle className="flex items-center gap-2">
												<f.icon className="size-5 text-primary" />
												{f.title}
											</CardTitle>
											<CardDescription>
												{f.description}
											</CardDescription>
										</CardHeader>
									</Card>
								))}
							</div>
						</TabsContent>
					))}
				</TabsContents>
			</Tabs>
		</section>
	);
}

// --- Stats ---

function Stats() {
	return (
		<section className="py-16">
			<div className="grid gap-4 sm:grid-cols-3">
				<Card size="sm">
					<CardHeader>
						<CardTitle>Uptime</CardTitle>
					</CardHeader>
					<CardContent>
						<Progress value={99.9}>
							<ProgressLabel>99.9%</ProgressLabel>
							<ProgressValue />
						</Progress>
					</CardContent>
				</Card>
				<Card size="sm">
					<CardHeader>
						<CardTitle>Performance</CardTitle>
					</CardHeader>
					<CardContent>
						<Progress value={95}>
							<ProgressLabel>95 / 100</ProgressLabel>
							<ProgressValue />
						</Progress>
					</CardContent>
				</Card>
				<Card size="sm">
					<CardHeader>
						<CardTitle>Satisfaction</CardTitle>
					</CardHeader>
					<CardContent className="flex items-center gap-2">
						<StarRating defaultValue={5} size="sm" disabled />
						<span className="text-sm text-muted-foreground">
							4.9 / 5
						</span>
					</CardContent>
				</Card>
			</div>
		</section>
	);
}

// --- Pricing ---

const plans = [
	{
		name: "Free",
		monthly: 0,
		yearly: 0,
		features: ["1 project", "Community support", "Basic analytics"],
		cta: "Get Started",
		variant: "secondary" as const,
	},
	{
		name: "Pro",
		monthly: 29,
		yearly: 290,
		features: [
			"Unlimited projects",
			"Priority support",
			"Advanced analytics",
			"Team collaboration",
		],
		cta: "Upgrade to Pro",
		variant: "default" as const,
		highlighted: true,
	},
	{
		name: "Enterprise",
		monthly: 99,
		yearly: 990,
		features: [
			"Everything in Pro",
			"SSO & SAML",
			"Dedicated support",
			"Custom SLA",
			"Audit logs",
		],
		cta: "Contact Sales",
		variant: "outline" as const,
	},
];

function Pricing() {
	const [isYearly, setIsYearly] = useState(false);

	return (
		<section className="py-16">
			<h2 className="mb-2 text-center text-3xl font-bold">Pricing</h2>
			<p className="mb-8 text-center text-muted-foreground">
				Start free, scale when you need to.
			</p>
			<div className="mb-8 flex items-center justify-center gap-3">
				<Label htmlFor="billing-toggle">Monthly</Label>
				<Switch
					id="billing-toggle"
					checked={isYearly}
					onCheckedChange={setIsYearly}
				/>
				<Label htmlFor="billing-toggle">
					Yearly{" "}
					<Badge variant="secondary" className="ml-1">
						Save 17%
					</Badge>
				</Label>
			</div>
			<div className="grid gap-4 sm:grid-cols-3">
				{plans.map((plan) => {
					const price = isYearly ? plan.yearly : plan.monthly;
					return (
						<Card
							key={plan.name}
							decorations={plan.highlighted}
						>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									{plan.name}
									{plan.highlighted && (
										<Badge>Most Popular</Badge>
									)}
								</CardTitle>
								<CardDescription>
									<span className="text-3xl font-bold text-foreground">
										${price}
									</span>
									{price > 0 && (
										<span className="text-muted-foreground">
											/{isYearly ? "yr" : "mo"}
										</span>
									)}
								</CardDescription>
							</CardHeader>
							<CardContent>
								<Separator className="mb-4" />
								<ul className="space-y-2 text-sm">
									{plan.features.map((f) => (
										<li
											key={f}
											className="flex items-center gap-2"
										>
											<Zap className="size-3.5 text-primary" />
											{f}
										</li>
									))}
								</ul>
							</CardContent>
							<CardFooter>
								<Button
									variant={plan.variant}
									className="w-full"
								>
									{plan.cta}
								</Button>
							</CardFooter>
						</Card>
					);
				})}
			</div>
		</section>
	);
}

// --- Testimonials ---

const testimonials = [
	{
		name: "Sarah Chen",
		initials: "SC",
		rating: 5,
		quote: "Zalem cut our shipping time in half. The DX is unmatched.",
	},
	{
		name: "Marcus Rivera",
		initials: "MR",
		rating: 5,
		quote: "Finally a platform that doesn't get in the way. Love it.",
	},
	{
		name: "Aisha Patel",
		initials: "AP",
		rating: 4,
		quote: "Great tooling and the team is super responsive to feedback.",
	},
];

function Testimonials() {
	return (
		<section className="py-16">
			<h2 className="mb-8 text-center text-3xl font-bold">
				What developers say
			</h2>
			<div className="grid gap-4 sm:grid-cols-3">
				{testimonials.map((t) => (
					<Card key={t.name}>
						<CardHeader>
							<div className="flex items-center gap-3">
								<Avatar size="sm">
									<AvatarFallback>
										{t.initials}
									</AvatarFallback>
								</Avatar>
								<div>
									<CardTitle className="text-sm">
										{t.name}
									</CardTitle>
									<StarRating
										defaultValue={t.rating}
										size="sm"
										disabled
									/>
								</div>
							</div>
						</CardHeader>
						<CardContent>
							<p className="text-sm text-muted-foreground italic">
								&ldquo;{t.quote}&rdquo;
							</p>
						</CardContent>
					</Card>
				))}
			</div>
		</section>
	);
}

// --- FAQ ---

const faqItems = [
	{
		q: "How does the free tier work?",
		a: "You get one project with full access to core features. No credit card required. Upgrade anytime.",
	},
	{
		q: "Can I self-host Zalem?",
		a: "Not yet, but we're exploring it. Enterprise customers can request on-prem deployment.",
	},
	{
		q: "What kind of support do you offer?",
		a: "Free users get community support. Pro and Enterprise plans include priority and dedicated support channels.",
	},
	{
		q: "Is my data safe?",
		a: "Absolutely. All data is encrypted at rest and in transit. We're SOC 2 Type II compliant.",
	},
];

function FAQ() {
	return (
		<section className="mx-auto max-w-2xl py-16">
			<h2 className="mb-8 text-center text-3xl font-bold">FAQ</h2>
			<Accordion>
				{faqItems.map((item) => (
					<AccordionItem key={item.q} value={item.q}>
						<AccordionTrigger>{item.q}</AccordionTrigger>
						<AccordionContent>
							<p className="text-sm text-muted-foreground">
								{item.a}
							</p>
						</AccordionContent>
					</AccordionItem>
				))}
			</Accordion>
		</section>
	);
}

// --- CTA / Newsletter ---

function CTA() {
	return (
		<section className="py-16">
			<Card decorations className="mx-auto max-w-lg p-8 text-center">
				<CardHeader>
					<CardTitle className="text-2xl">Stay in the loop</CardTitle>
					<CardDescription>
						Get product updates and early access to new features.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex gap-2">
						<Input
							type="email"
							placeholder="you@example.com"
							className="flex-1"
						/>
						<Button>Subscribe</Button>
					</div>
				</CardContent>
				<CardFooter className="justify-center">
					<Authenticated>
						<p className="text-sm text-muted-foreground">
							Welcome back!{" "}
							<Link
								href="/dashboard"
								className="text-primary underline underline-offset-4"
							>
								Go to dashboard
							</Link>
						</p>
					</Authenticated>
					<Unauthenticated>
						<p className="text-sm text-muted-foreground">
							Or{" "}
							<SignInButton>
								<button
									type="button"
									className="text-primary underline underline-offset-4"
								>
									sign in
								</button>
							</SignInButton>{" "}
							to get started.
						</p>
					</Unauthenticated>
					<AuthLoading>
						<Spinner size="size-4" />
					</AuthLoading>
				</CardFooter>
			</Card>
		</section>
	);
}

// --- Interactive Demo ---

function InteractiveDemo() {
	return (
		<section className="flex flex-wrap items-center justify-center gap-4 py-16">
			<Dialog>
				<DialogTrigger
					render={<Button variant="outline" size="lg" />}
				>
					<Rocket className="size-4" />
					Open Demo Dialog
				</DialogTrigger>
				<DialogBackdrop />
				<DialogPopup>
					<DialogHeader>
						<DialogTitle>Welcome to Zalem</DialogTitle>
						<DialogDescription>
							This is an interactive demo showcasing the dialog
							component. Explore the design system in action.
						</DialogDescription>
					</DialogHeader>
					<div className="py-4 text-sm text-muted-foreground">
						Tabs, accordions, cards, toasts — everything is built
						with the optics design system for a consistent,
						polished experience.
					</div>
					<DialogFooter>
						<DialogClose
							render={
								<Button variant="secondary">Close</Button>
							}
						/>
						<Button>Got it</Button>
					</DialogFooter>
				</DialogPopup>
			</Dialog>

			<Button
				variant="success"
				size="lg"
				onClick={() =>
					toast({
						type: "success",
						title: "Action completed",
						description: "Everything is working smoothly!",
					})
				}
			>
				<Sparkles className="size-4" />
				Trigger Toast
			</Button>
		</section>
	);
}

// --- Page ---

export default function Home() {
	return (
		<div className="container mx-auto max-w-5xl px-4">
			<Hero />
			<SocialProof />
			<Features />
			<Stats />
			<Pricing />
			<Testimonials />
			<FAQ />
			<CTA />
			<InteractiveDemo />
		</div>
	);
}
