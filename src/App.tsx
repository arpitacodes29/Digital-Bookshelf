import { useState, useEffect } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Search,
  Star,
  X,
  BookOpen,
  Plus,
  Trash2,
  Flower2,
  Leaf,
  Check,
} from "lucide-react";

type Book = {
  id: string;
  title: string;
  author: string;
  genre: string;
  subjects: string[];
  cover: string;
};

const fallbackCover = (title: string) => {
  const colors = [
    ["2f4053", "ffffff"],
    ["5b3b6f", "ffffff"],
    ["c44536", "ffffff"],
    ["d97706", "ffffff"],
    ["386641", "ffffff"],
    ["6d597a", "ffffff"],
  ];

  const color = colors[title.length % colors.length];

  return `https://placehold.co/300x450/${color[0]}/${color[1]}?text=${encodeURIComponent(
    title
  )}`;
};

export default function App() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Book[]>([]);
  const [selected, setSelected] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);
  const [recMode, setRecMode] = useState<"genre" | "author">("genre");
  const [recommendations, setRecommendations] = useState<Book[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const [shelf, setShelf] = useState<Book[]>(() => {
    const saved = localStorage.getItem("myBookshelf");
    return saved ? JSON.parse(saved) : [];
  });

  const [ratings, setRatings] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("myBookRatings");
    return saved ? JSON.parse(saved) : {};
  });

  const [notes, setNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem("myBookNotes");
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    localStorage.setItem("myBookshelf", JSON.stringify(shelf));
  }, [shelf]);

  useEffect(() => {
    localStorage.setItem("myBookRatings", JSON.stringify(ratings));
  }, [ratings]);

  useEffect(() => {
    localStorage.setItem("myBookNotes", JSON.stringify(notes));
  }, [notes]);

  const isBookAdded = (bookId: string) => {
    return shelf.some((book) => book.id === bookId);
  };

  const formatBook = (item: any): Book => {
    const subjects = item.subject?.slice(0, 8) || [];

    return {
      id: item.key || item.edition_key?.[0] || item.title,
      title: item.title || "Unknown Title",
      author: item.author_name?.[0] || "Unknown Author",
      genre: subjects[0] || "General",
      subjects,
      cover: item.cover_i
        ? `https://covers.openlibrary.org/b/id/${item.cover_i}-L.jpg`
        : fallbackCover(item.title || "Unknown Book"),
    };
  };

  const searchBooks = async () => {
    if (!query.trim()) return;

    setLoading(true);

    try {
      const res = await fetch(
        `https://openlibrary.org/search.json?q=${encodeURIComponent(
          query
        )}&limit=8`
      );

      const data = await res.json();
      setResults(data.docs.map(formatBook));
    } catch {
      alert("Book search failed. Please try again.");
    }

    setLoading(false);
  };

  const fetchRecommendations = async (
    book: Book,
    mode: "genre" | "author"
  ) => {
    setRecommendations([]);
    setRecLoading(true);

    let apiUrl = "";

    if (mode === "author") {
      apiUrl = `https://openlibrary.org/search.json?author=${encodeURIComponent(
        book.author
      )}&limit=12`;
    } else {
      const bestSubject =
        book.subjects.find(
          (subject) =>
            ![
              "fiction",
              "general",
              "literature",
              "accessible book",
              "protected daisy",
            ].includes(subject.toLowerCase())
        ) || book.genre;

      apiUrl = `https://openlibrary.org/subjects/${encodeURIComponent(
        bestSubject.toLowerCase().replaceAll(" ", "_")
      )}.json?limit=12`;
    }

    try {
      const res = await fetch(apiUrl);
      const data = await res.json();

      const rawBooks = mode === "genre" ? data.works || [] : data.docs || [];

      const recs: Book[] = rawBooks
        .map((item: any) => {
          if (mode === "genre") {
            return {
              id: item.key,
              title: item.title || "Unknown Title",
              author: item.authors?.[0]?.name || "Unknown Author",
              genre: book.genre,
              subjects: book.subjects,
              cover: item.cover_id
                ? `https://covers.openlibrary.org/b/id/${item.cover_id}-L.jpg`
                : fallbackCover(item.title || "Unknown Book"),
            };
          }

          return formatBook(item);
        })
        .filter((b: Book) => b.title !== book.title)
        .slice(0, 5);

      setRecommendations(recs);
    } catch {
      setRecommendations([]);
    }

    setRecLoading(false);
  };

  const addBook = (book: Book) => {
    if (!isBookAdded(book.id)) {
      setShelf([...shelf, book]);
    }

    setQuery("");
    setResults([]);
  };

  const openBook = (book: Book) => {
    setSelected(book);
    setRecMode("genre");
    fetchRecommendations(book, "genre");
  };

  const changeRecommendationMode = (mode: "genre" | "author") => {
    setRecMode(mode);
    if (selected) fetchRecommendations(selected, mode);
  };

  const removeBook = (bookId: string) => {
    setShelf(shelf.filter((book) => book.id !== bookId));
    setSelected(null);
  };

  return (
    <div className="min-h-screen bg-[#fbedf3] p-6 text-[#8e6570]">
      <div className="pointer-events-none fixed left-6 top-8 text-[#b88991]/40">
        <Leaf className="h-16 w-16 rotate-[-25deg]" />
      </div>

      <div className="pointer-events-none fixed right-8 top-24 text-[#b88991]/40">
        <Flower2 className="h-14 w-14 rotate-12" />
      </div>

      <div className="pointer-events-none fixed bottom-8 left-12 text-[#b88991]/40">
        <Flower2 className="h-16 w-16 rotate-45" />
      </div>

      <div className="pointer-events-none fixed bottom-10 right-12 text-[#b88991]/40">
        <Leaf className="h-20 w-20 rotate-[30deg]" />
      </div>

      <div className="mx-auto max-w-6xl">
        <h1 className="mb-2 text-center text-4xl font-bold text-pink-700">
          My Digital Bookshelf
        </h1>

        <p className="mb-8 text-center text-pink-500">
          Search real books, add them to your shelf, rate them, and drag them
          around.
        </p>

        <div className="mx-auto mb-8 max-w-2xl rounded-3xl bg-white p-5 shadow-lg">
          <div className="flex gap-3">
            <div className="flex flex-1 items-center gap-3 rounded-2xl border p-3">
              <Search className="text-pink-500" />

              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchBooks()}
                placeholder="Search any book..."
                className="w-full outline-none"
              />
            </div>

            <button
              onClick={searchBooks}
              className="rounded-2xl bg-pink-600 px-5 text-white hover:bg-pink-700"
            >
              Search
            </button>
          </div>

          {loading && <p className="mt-4 text-pink-500">Searching...</p>}

          {results.length > 0 && (
            <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-2">
              {results.map((book) => (
                <div
                  key={book.id}
                  className="flex items-center justify-between rounded-2xl bg-pink-100 p-3"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="h-20 w-14 rounded object-cover"
                    />

                    <div>
                      <p className="font-semibold">{book.title}</p>
                      <p className="text-sm text-stone-600">{book.author}</p>
                      <p className="text-xs text-pink-600">{book.genre}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => addBook(book)}
                    className={`rounded-xl p-2 shadow transition ${
                      isBookAdded(book.id)
                        ? "bg-green-100 text-green-700"
                        : "bg-white text-pink-600 hover:bg-pink-200"
                    }`}
                  >
                    {isBookAdded(book.id) ? <Check /> : <Plus />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-pink-700">My Shelf</h2>

          <p className="text-sm text-pink-500">
            {shelf.length} book{shelf.length === 1 ? "" : "s"}
          </p>
        </div>

        <div className="rounded-[2rem] border-2 border-dashed border-[#d8a6af] bg-pink-100 p-6 shadow-xl">
          {shelf.length > 0 ? (
            <Reorder.Group
              axis="x"
              values={shelf}
              onReorder={setShelf}
              className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5"
            >
              {shelf.map((book) => (
                <Reorder.Item key={book.id} value={book} className="list-none">
                  <motion.button
                    whileHover={{ y: -8 }}
                    onClick={() => openBook(book)}
                    className="flex w-full flex-col items-center"
                  >
                    <img
                      src={book.cover}
                      alt={book.title}
                      className="h-52 rounded-lg object-cover shadow-lg"
                    />

                    <p className="mt-2 line-clamp-2 text-center text-sm font-medium">
                      {book.title}
                    </p>
                  </motion.button>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-pink-500">
              <BookOpen className="mb-3 h-14 w-14" />
              <p>Add books to your digital shelf.</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {selected && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-[#7a5b60]/70 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ scale: 0.94, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 20 }}
              className="relative max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[2rem] border-2 border-[#d5a4ad] bg-[#fff7f8] shadow-2xl"
            >
              <div className="pointer-events-none absolute left-5 top-5 text-[#c99aa4]/50">
                <Leaf className="h-14 w-14 rotate-[-30deg]" />
              </div>

              <div className="pointer-events-none absolute right-20 top-6 text-[#c99aa4]/50">
                <Flower2 className="h-9 w-9 rotate-12" />
              </div>

              <div className="pointer-events-none absolute bottom-6 right-8 text-[#c99aa4]/50">
                <Leaf className="h-14 w-14 rotate-[35deg]" />
              </div>

              <div className="relative p-9">
                <button
                  onClick={() => setSelected(null)}
                  className="absolute right-8 top-6 rounded-full bg-[#f8e4e8] p-3 text-[#b77d89] hover:bg-[#efd0d6]"
                >
                  <X />
                </button>

                <div className="flex flex-col gap-8 md:flex-row">
                  <img
                    src={selected.cover}
                    alt={selected.title}
                    className="h-64 w-40 rounded-xl object-cover shadow-xl"
                  />

                  <div>
                    <h2 className="font-serif text-4xl text-[#74535b]">
                      {selected.title}
                    </h2>

                    <p className="mt-2 text-xl italic text-[#cf929d]">
                      by {selected.author}
                    </p>

                    <p className="mt-5 inline-block rounded-full border border-[#d5a4ad] bg-[#f9e7eb] px-6 py-2 text-sm font-bold text-[#bb8b96]">
                      {selected.genre}
                    </p>

                    <div className="mt-6">
                      <div className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-[#a87984]">
                        Your Rating <Flower2 className="h-4 w-4" />
                      </div>

                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() =>
                              setRatings({
                                ...ratings,
                                [selected.id]: star,
                              })
                            }
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= (ratings[selected.id] || 0)
                                  ? "fill-[#e89c6d] text-[#e89c6d]"
                                  : "text-[#dfc1c7]"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-y border-dashed border-[#ddb5bd] px-9 py-7">
                <h3 className="mb-4 text-sm font-bold uppercase tracking-[0.25em] text-[#cf929d]">
                  About This Book
                </h3>

                <textarea
                  value={notes[selected.id] || ""}
                  onChange={(e) =>
                    setNotes({
                      ...notes,
                      [selected.id]: e.target.value,
                    })
                  }
                  placeholder="Write your thoughts, favorite quotes, or review here..."
                  className="min-h-36 w-full resize-none rounded-2xl border border-[#ddb5bd] bg-white/70 p-4 text-lg leading-relaxed text-[#9a6f78] outline-none placeholder:text-[#caa1aa] focus:border-[#c88f9a]"
                />
              </div>

              <div className="px-9 py-7">
                <div className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-[0.25em] text-[#cf929d]">
                  You Might Also Like <Flower2 className="h-4 w-4" />
                </div>

                <div className="mb-6 flex gap-3">
                  <button
                    onClick={() => changeRecommendationMode("genre")}
                    className={`rounded-full border px-8 py-3 font-bold ${
                      recMode === "genre"
                        ? "bg-[#c88f9a] text-white"
                        : "bg-white text-[#a87984] border-[#d5a4ad]"
                    }`}
                  >
                    similar genre
                  </button>

                  <button
                    onClick={() => changeRecommendationMode("author")}
                    className={`rounded-full border px-8 py-3 font-bold ${
                      recMode === "author"
                        ? "bg-[#c88f9a] text-white"
                        : "bg-white text-[#a87984] border-[#d5a4ad]"
                    }`}
                  >
                    more by author
                  </button>
                </div>

                {recLoading && (
                  <p className="mb-4 text-sm text-[#a87984]">
                    Finding pretty recommendations...
                  </p>
                )}

                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 md:grid-cols-5">
                  {recommendations.map((book) => (
                    <div key={book.id} className="text-center">
                      <img
                        src={book.cover}
                        alt={book.title}
                        className="mx-auto h-48 w-36 rounded-lg object-cover shadow-md"
                      />

                      <p className="mt-2 line-clamp-1 font-serif text-[#74535b]">
                        {book.title}
                      </p>

                      <p className="text-sm text-[#cf929d]">{book.author}</p>

                      <button
                        onClick={() => addBook(book)}
                        className={`mt-2 flex items-center justify-center gap-1 rounded-full border px-6 py-1 text-sm font-bold transition ${
                          isBookAdded(book.id)
                            ? "border-green-300 bg-green-100 text-green-700"
                            : "border-[#d5a4ad] text-[#c88f9a] hover:bg-[#f9e7eb]"
                        }`}
                      >
                        {isBookAdded(book.id) ? (
                          <>
                            <Check className="h-4 w-4" />
                            added
                          </>
                        ) : (
                          <>
                            <Plus className="h-4 w-4" />
                            add
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => removeBook(selected.id)}
                  className="mt-8 flex items-center gap-2 rounded-full border border-[#d5a4ad] px-7 py-3 font-bold text-[#a87984] hover:bg-[#f9e7eb]"
                >
                  <Trash2 className="h-4 w-4" />
                  remove from shelf
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}