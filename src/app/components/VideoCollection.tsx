import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import {
  Search,
  Moon,
  Sun,
  Columns,
  Rows,
  Tag,
  AlignLeft,
  User,
  FolderOpen,
} from "lucide-react";
import { VideoList } from "./VideoList";
import { VideoPlayer } from "./VideoPlayer";

interface Video {
  id: string;
  slug: string;
  concept: string;
  title: string;
  author: string;
  thumbnail: string;
  duration: string;
  language: string;
  subtitles: string[];
  description: string;
  videoUrl: string;
  keywords: string[];
  transcript?: string;
}

const videoData: Video[] = [
  {
    id: "1",
    slug: "7-generation-principle",
    concept: "Post Growth Toolkit",
    title: "7 Generation Principle",
    author: "Rose O'Leary",
    thumbnail:
      "https://images.unsplash.com/photo-1547021952-d11ce824a664?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY29sb2dpY2FsJTIwc3VzdGFpbmFiaWxpdHklMjBuYXR1cmV8ZW58MXx8fHwxNzczMjM5ODA2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "12:34",
    language: "English",
    subtitles: ["English", "French", "Spanish"],
    description:
      "An exploration of the indigenous principle of considering seven generations in decision-making processes.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: [
      "indigenous",
      "sustainability",
      "long-term thinking",
    ],
    transcript: "Available upon request",
  },
  {
    id: "2",
    slug: "a-world-without-production",
    concept: "Post Growth Toolkit",
    title: "A World Without Production",
    author: "Dusan Kazic",
    thumbnail:
      "https://images.unsplash.com/photo-1760992003940-575677a51d96?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbnZpcm9ubWVudGFsJTIwYWN0aXZpc20lMjBwcm90ZXN0fGVufDF8fHx8MTc3MzIzOTgwN3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "18:45",
    language: "English",
    subtitles: ["English", "French"],
    description:
      "Discussing alternative economic models that challenge traditional production paradigms.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["economics", "production", "alternative models"],
  },
  {
    id: "3",
    slug: "advice",
    concept: "Radical Ecological Shifts",
    title: "Advice",
    author: "Jay Jordan",
    thumbnail:
      "https://images.unsplash.com/photo-1628206554160-63e8c921e398?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZW5ld2FibGUlMjBlbmVyZ3klMjBzb2xhciUyMHBhbmVsc3xlbnwxfHx8fDE3NzMyMjg0ODV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "15:20",
    language: "English",
    subtitles: ["English", "French", "Spanish", "German"],
    description:
      "Practical advice for implementing radical ecological changes in contemporary society.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["activism", "ecology", "practical change"],
  },
  {
    id: "4",
    slug: "ant-manifesto",
    concept: "Post Growth Toolkit",
    title: "Ant Manifesto",
    author: "Geoffrey Bowker",
    thumbnail:
      "https://images.unsplash.com/photo-1617529678226-d5273fd7377d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1cmJhbiUyMGdhcmRlbiUyMHBsYW50c3xlbnwxfHx8fDE3NzMyMzk4MDd8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "22:10",
    language: "English",
    subtitles: ["English"],
    description:
      "Drawing lessons from ant colonies for understanding complex systems and collective behavior.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: [
      "collective behavior",
      "systems thinking",
      "nature",
    ],
  },
  {
    id: "5",
    slug: "anthropology-of-plants",
    concept: "Post Growth Toolkit",
    title: "Anthropology of Plants",
    author: "Dusan Kazic",
    thumbnail:
      "https://images.unsplash.com/photo-1769211833882-75f45dee6632?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmb3Jlc3QlMjBlY29zeXN0ZW0lMjBiaW9kaXZlcnNpdHl8ZW58MXx8fHwxNzczMjM5ODA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "16:55",
    language: "English",
    subtitles: ["English", "French"],
    description:
      "Exploring the relationship between humans and plants from an anthropological perspective.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: [
      "anthropology",
      "plants",
      "human-nature relations",
    ],
  },
  {
    id: "6",
    slug: "becoming-alien",
    concept: "Post Growth Toolkit",
    title: "Becoming Alien",
    author: "Ewen Chardronnet",
    thumbnail:
      "https://images.unsplash.com/photo-1736259643569-ca741718d7b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjbGltYXRlJTIwY2hhbmdlJTIwZG9jdW1lbnRhcnl8ZW58MXx8fHwxNzczMjM5ODA4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "19:30",
    language: "French",
    subtitles: ["English", "French"],
    description:
      "A philosophical exploration of alienation and otherness in the Anthropocene.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["philosophy", "alienation", "anthropocene"],
  },
  {
    id: "7",
    slug: "bio-diversity",
    concept: "Post Growth Toolkit",
    title: "Bio-diversity",
    author: "Geoffrey Bowker",
    thumbnail:
      "https://images.unsplash.com/photo-1757525473930-0b82237e55ac?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzdXN0YWluYWJsZSUyMGFncmljdWx0dXJlJTIwZmFybWluZ3xlbnwxfHx8fDE3NzMxNTgzMTl8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "14:25",
    language: "English",
    subtitles: ["English", "French", "Spanish"],
    description:
      "Understanding biodiversity through infrastructure studies and classification systems.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: [
      "biodiversity",
      "classification",
      "infrastructure",
    ],
  },
  {
    id: "8",
    slug: "bonheur",
    concept: "Radical Ecological Shifts",
    title: "Bonheur",
    author: "Wim Cuyvers",
    thumbnail:
      "https://images.unsplash.com/photo-1762279389020-eeeb69c25813?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlY29ub21pYyUyMGdyb3d0aCUyMGNoYXJ0JTIwZ3JhcGh8ZW58MXx8fHwxNzczMjM5ODA5fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "21:15",
    language: "French",
    subtitles: ["English", "French"],
    description:
      "Reconsidering happiness outside of economic growth metrics.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["happiness", "wellbeing", "economics"],
  },
  {
    id: "9",
    slug: "broken-world-thinking",
    concept: "Post Growth Toolkit",
    title: "Broken World Thinking",
    author: "Steven Jackson",
    thumbnail:
      "https://images.unsplash.com/photo-1759434110519-e365bfddc56e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0ZWNobm9sb2d5JTIwZGlnaXRhbCUyMHdvcmxkfGVufDF8fHx8MTc3MzIzOTgwOXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "17:40",
    language: "English",
    subtitles: ["English", "French"],
    description:
      "Exploring repair, maintenance, and breakdown in technological systems.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["repair", "maintenance", "technology"],
  },
  {
    id: "10",
    slug: "co2-emissions-economic-growth",
    concept: "Shadow Growth",
    title: "CO2 Emissions & Economic Growth",
    author: "Gregory Lusk",
    thumbnail:
      "https://images.unsplash.com/photo-1772763241433-36efc9211c1e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwcG9sbHV0aW9uJTIwZW1pc3Npb25zfGVufDF8fHx8MTc3MzIzOTgxMHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "20:05",
    language: "English",
    subtitles: ["English", "Spanish"],
    description:
      "Examining the correlation between carbon emissions and economic expansion.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["climate", "emissions", "growth"],
  },
  {
    id: "11",
    slug: "collapse-informatics",
    concept: "Post Growth Toolkit",
    title: "Collapse Informatics",
    author: "Bill Tomlinson",
    thumbnail:
      "https://images.unsplash.com/photo-1632580254134-94c4a73dab76?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb21tdW5pdHklMjBnYXRoZXJpbmclMjBwZW9wbGV8ZW58MXx8fHwxNzczMjE4MzYxfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "23:50",
    language: "English",
    subtitles: ["English", "French"],
    description:
      "Computing technologies designed for societal collapse scenarios.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["technology", "resilience", "collapse"],
  },
  {
    id: "12",
    slug: "communs-negatifs",
    concept: "Radical Ecological Shifts",
    title: "Communs Négatifs",
    author: "Alexandre Monnin",
    thumbnail:
      "https://images.unsplash.com/photo-1644337540803-2b2fb3cebf12?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwd29ya3NwYWNlJTIwZGVza3xlbnwxfHx8fDE3NzMxNzY0NjR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "18:20",
    language: "French",
    subtitles: ["English", "French"],
    description:
      "The concept of negative commons and shared responsibilities for ecological damage.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["commons", "responsibility", "ecology"],
  },
  {
    id: "13",
    slug: "conscience-d-echelle",
    concept: "Radical Ecological Shifts",
    title: "Conscience d'échelle",
    author: "Cedric Carles",
    thumbnail:
      "https://images.unsplash.com/photo-1742412615753-187a80f4e30c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGVhcnRoJTIwcGxhbmV0fGVufDF8fHx8MTc3MzIzOTgxMXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "16:35",
    language: "French",
    subtitles: ["English", "French"],
    description:
      "Developing awareness of scale in ecological and social systems.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["scale", "awareness", "systems"],
  },
  {
    id: "14",
    slug: "continuite",
    concept: "Radical Ecological Shifts",
    title: "Continuité",
    author: "Wim Cuyvers",
    thumbnail:
      "https://images.unsplash.com/photo-1666804830091-56ba0e22becf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyZWN5Y2xpbmclMjBjaXJjdWxhciUyMGVjb25vbXl8ZW58MXx8fHwxNzczMTQ0NzA3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "19:45",
    language: "French",
    subtitles: ["French", "English"],
    description:
      "Continuity and transformation in architectural and social practice.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["architecture", "transformation", "continuity"],
  },
  {
    id: "15",
    slug: "courage",
    concept: "Radical Ecological Shifts",
    title: "Courage",
    author: "Wim Cuyvers",
    thumbnail:
      "https://images.unsplash.com/photo-1707944746058-4da338d0f827?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY2llbnRpc3QlMjByZXNlYXJjaCUyMGxhYm9yYXRvcnl8ZW58MXx8fHwxNzczMTMwNTc1fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "14:50",
    language: "French",
    subtitles: ["French", "English"],
    description:
      "The role of courage in facing ecological and social challenges.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["courage", "action", "challenge"],
  },
  {
    id: "16",
    slug: "creation-de-formation",
    concept: "Radical Ecological Shifts",
    title: "Création de formation",
    author: "Alexandre Monnin",
    thumbnail:
      "https://images.unsplash.com/photo-1732559207172-570f74930b07?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3aW5kJTIwdHVyYmluZXMlMjBlbmVyZ3l8ZW58MXx8fHwxNzczMjM5ODEzfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "22:30",
    language: "French",
    subtitles: ["English", "French"],
    description:
      "Creating educational frameworks for ecological transition.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["education", "training", "transition"],
  },
  {
    id: "17",
    slug: "de-economising-the-world",
    concept: "Post Growth Toolkit",
    title: "De-Economising The World",
    author: "Dusan Kazic",
    thumbnail:
      "https://images.unsplash.com/photo-1547067046-513e180ad796?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvY2VhbiUyMHdhdGVyJTIwY29uc2VydmF0aW9ufGVufDF8fHx8MTc3MzE1NDI1NXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "25:15",
    language: "English",
    subtitles: ["English", "French", "Spanish"],
    description:
      "Challenging the economic framing of social and ecological relations.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["economics", "critique", "alternatives"],
  },
  {
    id: "18",
    slug: "debut-de-bifurcation",
    concept: "Radical Ecological Shifts",
    title: "Début de bifurcation",
    author: "Alexandre Monnin",
    thumbnail:
      "https://images.unsplash.com/photo-1617357978159-3f6551e11751?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcmNoaXRlY3R1cmFsJTIwc3VzdGFpbmFibGUlMjBidWlsZGluZ3xlbnwxfHx8fDE3NzMyMzk4MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "17:25",
    language: "French",
    subtitles: ["English", "French"],
    description:
      "The beginning of bifurcation: choosing new paths for the future.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["bifurcation", "choice", "future"],
  },
  {
    id: "19",
    slug: "discount-rate",
    concept: "Shadow Growth",
    title: "Discount Rate",
    author: "David Archer",
    thumbnail:
      "https://images.unsplash.com/photo-1759494373228-f2b9f5d0dc2f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxuYXR1cmFsJTIwcmVzb3VyY2VzJTIwbWluaW5nfGVufDF8fHx8MTc3MzIzOTgxM3ww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "13:40",
    language: "English",
    subtitles: ["English"],
    description:
      "Understanding discount rates in climate economics and policy.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["economics", "climate policy", "discount rate"],
  },
  {
    id: "20",
    slug: "discount-rate-pt-2",
    concept: "Shadow Growth",
    title: "Discount Rate (Pt. 2)",
    author: "David Archer",
    thumbnail:
      "https://images.unsplash.com/photo-1573757056004-065ad36e2cf4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmdXR1cmUlMjB0ZWNobm9sb2d5JTIwaW5ub3ZhdGlvbnxlbnwxfHx8fDE3NzMxNTA0NjZ8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    duration: "15:20",
    language: "English",
    subtitles: ["English"],
    description:
      "Continued discussion on discount rates and intergenerational equity.",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    keywords: ["economics", "intergenerational", "equity"],
  },
];

interface VideoCollectionProps {
  isDarkMode: boolean;
  setIsDarkMode: (value: boolean) => void;
}

export function VideoCollection({
  isDarkMode,
  setIsDarkMode,
}: VideoCollectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedConcept, setSelectedConcept] = useState("All");
  const [selectedVideo, setSelectedVideo] =
    useState<Video | null>(null);
  const [layoutMode, setLayoutMode] = useState<
    "side" | "stacked"
  >("side");
  const [showKeywords, setShowKeywords] = useState(true);
  const [selectedKeyword, setSelectedKeyword] = useState<
    string | null
  >(null);
  const [selectedAuthor, setSelectedAuthor] = useState<
    string | null
  >(null);
  const [sortBy, setSortBy] = useState<
    "title" | "author" | null
  >(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(
    "asc",
  );
  const [showTitle, setShowTitle] = useState(true);
  const [showAuthor, setShowAuthor] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [showCategory, setShowCategory] = useState(false);

  const concepts = [
    "All",
    ...Array.from(new Set(videoData.map((v) => v.concept))),
  ];

  const filteredVideos = useMemo(() => {
    let filtered = videoData.filter((video) => {
      const matchesSearch =
        searchQuery === "" ||
        video.title
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        video.author
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        video.concept
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesConcept =
        selectedConcept === "All" ||
        video.concept === selectedConcept;

      const matchesKeyword =
        !selectedKeyword ||
        video.keywords.includes(selectedKeyword);

      const matchesAuthor =
        !selectedAuthor ||
        video.author.toLowerCase().includes(selectedAuthor.toLowerCase());

      return matchesSearch && matchesConcept && matchesKeyword && matchesAuthor;
    });

    // Apply sorting
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortBy].toLowerCase();
        const bValue = b[sortBy].toLowerCase();

        if (sortOrder === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filtered;
  }, [
    searchQuery,
    selectedConcept,
    selectedKeyword,
    selectedAuthor,
    sortBy,
    sortOrder,
  ]);

  const handleSort = (column: "title" | "author") => {
    if (sortBy === column) {
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else {
        setSortBy(null);
        setSortOrder("asc");
      }
    } else {
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  const handleKeywordClick = (keyword: string) => {
    if (selectedKeyword === keyword) {
      setSelectedKeyword(null);
    } else {
      setSelectedKeyword(keyword);
    }
  };

  const clearKeywordFilter = () => {
    setSelectedKeyword(null);
  };

  const handleAuthorClick = (author: string) => {
    if (selectedAuthor === author) {
      setSelectedAuthor(null);
    } else {
      setSelectedAuthor(author);
    }
  };

  const clearAuthorFilter = () => {
    setSelectedAuthor(null);
  };

  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Load video from URL slug on mount or when slug changes
  useEffect(() => {
    if (slug) {
      const video = videoData.find((v) => v.slug === slug);
      if (video) {
        setSelectedVideo(video);
      }
    }
  }, [slug]);

  // Handle video selection and update URL
  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    navigate(`/${video.slug}`);
  };

  return (
    <div
      className={`flex ${layoutMode === "side" ? "flex-row h-screen" : "flex-col"} overflow-hidden`}
    >
      {/* Video Player - Top in stacked mode, Right in side mode */}
      {layoutMode === "stacked" && (
        <div className="w-full h-1/2 fixed top-0 left-0 right-0 overflow-y-auto border-b border-black dark:border-white bg-white dark:bg-black z-10">
          {selectedVideo ? (
            <VideoPlayer
              video={selectedVideo}
              layoutMode={layoutMode}
              onKeywordClick={handleKeywordClick}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <p className="text-sm text-neutral-400 text-center">
                Select a video from the list to view
              </p>
            </div>
          )}
        </div>
      )}

      {/* List Panel - Left in side mode, Bottom in stacked mode */}
      <div
        className={`${layoutMode === "side" ? "w-2/5 h-screen border-r" : "w-full h-1/2 mt-[50vh]"} overflow-y-auto border-black dark:border-white custom-scrollbar`}
      >
        <div className="p-6 md:p-8">
          {/* Header */}
          <header className="mb-6 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl mb-2 tracking-tight text-black dark:text-white font-['Arial_Black','Arial_Bold',Gadget,sans-serif] font-black">DISNOVATION.ORG</h1>
              <p className="text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-xl">
                Spanning energy, ecology, economics, and
                techno-solutionism. Video interviews archive.
              </p>
            </div>

            {/* Layout and Dark Mode Icons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() =>
                  setLayoutMode(
                    layoutMode === "side" ? "stacked" : "side",
                  )
                }
                className="p-2 text-black dark:text-white hover:opacity-60 transition-opacity"
                aria-label="Toggle layout"
              >
                {layoutMode === "side" ? (
                  <Rows className="w-5 h-5" />
                ) : (
                  <Columns className="w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 text-black dark:text-white hover:opacity-60 transition-opacity"
                aria-label="Toggle dark mode"
              >
                {isDarkMode ? (
                  <Sun className="w-5 h-5" />
                ) : (
                  <Moon className="w-5 h-5" />
                )}
              </button>
            </div>
          </header>

          {/* Filters */}
          <div className="mb-10 space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-0 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-6 pr-3 py-2 bg-transparent text-black dark:text-white placeholder-neutral-400 focus:outline-none text-base border-b border-neutral-300 dark:border-neutral-700"
                />
              </div>

              {/* Column Toggle Icons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setShowTitle(!showTitle)}
                  className={`p-2 text-black dark:text-white hover:opacity-60 transition-opacity ${showTitle ? "opacity-100" : "opacity-30"}`}
                  aria-label="Toggle titles"
                >
                  <AlignLeft className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowAuthor(!showAuthor)}
                  className={`p-2 text-black dark:text-white hover:opacity-60 transition-opacity ${showAuthor ? "opacity-100" : "opacity-30"}`}
                  aria-label="Toggle authors"
                >
                  <User className="w-5 h-5" />
                </button>

                <button
                  onClick={() => setShowCategory(!showCategory)}
                  className={`p-2 text-black dark:text-white hover:opacity-60 transition-opacity ${showCategory ? "opacity-100" : "opacity-30"}`}
                  aria-label="Toggle category"
                >
                  <FolderOpen className="w-5 h-5" />
                </button>

                <button
                  onClick={() => {
                    setShowTags(!showTags);
                    setShowKeywords(!showKeywords);
                  }}
                  className={`p-2 text-black dark:text-white hover:opacity-60 transition-opacity ${showTags && showKeywords ? "opacity-100" : "opacity-30"}`}
                  aria-label="Toggle tags"
                >
                  <Tag className="w-5 h-5" />
                </button>
              </div>
            </div>

          

            {selectedKeyword && (
              <div className="flex items-center justify-between py-2 border-b border-neutral-300 dark:border-neutral-700">
                <span className="text-base text-black dark:text-white">
                  Keyword:{" "}
                  <span className="font-bold">
                    {selectedKeyword}
                  </span>
                </span>
                <button
                  onClick={clearKeywordFilter}
                  className="text-sm text-black dark:text-white hover:opacity-60"
                >
                  Clear
                </button>
              </div>
            )}

            {selectedAuthor && (
              <div className="flex items-center justify-between py-2 border-b border-neutral-300 dark:border-neutral-700">
                <span className="text-base text-black dark:text-white">
                  Author:{" "}
                  <span className="font-bold">
                    {selectedAuthor}
                  </span>
                </span>
                <button
                  onClick={clearAuthorFilter}
                  className="text-sm text-black dark:text-white hover:opacity-60"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Video List */}
          <VideoList
            videos={filteredVideos}
            onSelectVideo={handleVideoSelect}
            selectedVideoId={selectedVideo?.id}
            showKeywords={showKeywords}
            onKeywordClick={handleKeywordClick}
            selectedKeyword={selectedKeyword}
            onSort={handleSort}
            sortBy={sortBy}
            sortOrder={sortOrder}
            showTitle={showTitle}
            showAuthor={showAuthor}
            showTags={showTags}
            showCategory={showCategory}
            onAuthorClick={handleAuthorClick}
            selectedAuthor={selectedAuthor}
          />

          {/* Count */}
          <div className="mt-6 text-xs text-neutral-400">
            {filteredVideos.length} / {videoData.length} videos
          </div>
        </div>
      </div>

      {/* Video Player - Right side in side mode */}
      {layoutMode === "side" && (
        <div className="w-3/5 h-screen overflow-hidden">
          {selectedVideo ? (
            <VideoPlayer
              video={selectedVideo}
              layoutMode={layoutMode}
              onKeywordClick={handleKeywordClick}
            />
          ) : (
            <div className="h-full flex items-center justify-center p-8">
              <p className="text-base text-white dark:text-white text-center max-w-md mx-auto">
                Spanning energy, ecology, economics, and
                techno-solutionism, most DISNOVATION.ORG
                projects begin with dialogue and documentation
                alongside experts and stakeholders. This archive
                gathers the interviews that underpin works such
                as the Post Growth Toolkit, ShadowGrowth, and
                Radical Ecological Shifts.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}