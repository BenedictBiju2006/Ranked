# Ranked

Rank anything.

Ranked is a chat-first ranking app that lets users create, manage, explore, and understand rankings of virtually anything — movies, food, games, people, places, products, ideas, or completely custom categories.

The core idea is simple:

> **Your rankings should be as easy to manage through conversation as they are through a traditional interface.**

Ranked combines a natural-language chat interface with a fully interactive visual dashboard. Both interfaces operate on the same ranking system, allowing users to move seamlessly between conversation and direct manipulation.

---

## Vision

Most ranking apps treat rankings as static lists.

Ranked treats them as living collections that can be edited, discussed, analysed, expanded, and understood.

A user should be able to say:

> "Create a ranking of every Marvel movie I've watched."

Then later:

> "Put Iron Man at 7.9."

> "What movies am I missing?"

> "I care more about rewatchability than technical filmmaking for this ranking."

> "What does this ranking say about my taste?"

The same changes should immediately appear in the visual dashboard.

Ranked is not a chatbot placed beside a ranking app.

It is one ranking system with two interaction modes.

# Project Structure

The application is organised primarily by feature.

```text
src/
├── app/
│   ├── _layout.tsx
│   ├── (auth)/
│   ├── (tabs)/
│   └── ranking/
│
├── features/
│   ├── rankings/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── api/
│   │   ├── types/
│   │   └── utils/
│   │
│   ├── chat/
│   ├── auth/
│   ├── profiles/
│   ├── suggestions/
│   └── insights/
│
├── components/
├── services/
├── stores/
├── hooks/
├── constants/
├── types/
└── utils/
```

Route files should remain thin.

Feature-specific business logic should live outside presentation components wherever practical.

---

# Tech Stack

## Application

* React Native
* Expo
* TypeScript
* Expo Router

## Backend

* Supabase
* PostgreSQL
* Supabase Auth
* Supabase Storage

## State and Data

* TanStack Query
* Zustand
* React local state

## Interaction

* React Native Reanimated
* React Native Gesture Handler
* Expo Haptics

## AI / Intelligence

Planned technologies include:

* Large language models
* Structured tool/action calling
* Embeddings
* Vector similarity
* Statistical analysis
* Clustering
* Recommendation algorithms

The exact AI infrastructure may evolve as the project develops.


Server data should not be unnecessarily duplicated into global client stores.

---

# Development Roadmap

## Phase 0 — Foundation

Build the core application infrastructure.

* Expo project setup
* TypeScript
* Expo Router
* Supabase
* Authentication
* Database schema
* Query layer
* Shared ranking domain model
* Core ranking operations

A ranking can be created, modified, persisted, reordered, and reloaded without relying on the UI.

---

## Phase 1 — Interactive Dashboard

Build Ranked as a complete traditional ranking application before introducing AI.

* Ranking dashboard
* Ranking detail screen
* Create ranking flow
* Edit ranking flow
* Score editing
* Drag-and-drop ordering
* Delete interactions
* Ranking settings
* Initial animation system
* Haptic interactions

### Exit condition

Ranked is useful even without its AI features.

---

## Phase 2 — Chat Interface

Introduce natural-language interaction.

Initial supported actions:

* Create ranking
* Rename ranking
* Add item
* Add multiple items
* Remove item
* Rate item
* Rerate item
* Reorder item
* Change scoring system
* Find ranking
* Show ranking

The LLM produces structured commands which are validated and executed by the ranking engine.

### Exit condition

A user can manage their rankings entirely through conversation.

---

## Phase 3 — Context Understanding

Ranked begins understanding the semantic meaning of rankings.

* Category inference
* Entity-type inference
* Ranking criteria
* Context extraction
* Persistent ranking context
* Natural-language context correction

### Exit condition

Ranked understands what is being ranked and what the user's scores are intended to represent.

---

## Phase 4 — Intelligent Suggestions

Introduce context-aware item suggestions.

* Missing-item detection
* Natural additions
* Duplicate detection
* Candidate validation
* Context-aware recommendations

### Exit condition

For common categories, Ranked can consistently suggest sensible additional items.

---

## Phase 5 — Ranking Insights

Introduce analytical intelligence.

Potential systems include:

* Descriptive statistics
* Metadata analysis
* Embeddings
* Cosine similarity
* Clustering
* Nearest-neighbour analysis
* Correlation analysis
* LLM-generated explanations

### Exit condition

Ranked can produce meaningful and defensible observations about a user's preferences.

---

## Phase 6 — MVP Polish

Freeze major feature development and focus on product quality.

* Performance
* Optimistic updates
* Loading states
* Error handling
* Empty states
* Offline behaviour where appropriate
* Animation consistency
* Accessibility
* Onboarding
* Search
* Profile management
* Haptics
* Interaction polish

---

# MVP Definition

Ranked reaches MVP when it supports:

* User accounts
* Persistent rankings
* Like/dislike rankings
* Five-star rankings
* Ten-point rankings
* Ranking creation and editing
* Fully interactive dashboard
* Chat-based ranking management
* Structured AI actions
* Automatic ranking-context inference
* Context correction through conversation
* Intelligent item suggestions
* Basic ranking analysis
* Fluid animations and interactions
* iOS support
* Android support
---

# Status

**Ranked is currently in early development.**

The initial focus is building the ranking engine and interactive application foundation before introducing the full AI system.

---

## License

License to be determined.
