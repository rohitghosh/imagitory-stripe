import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { FileUploadTile } from "@/components/FileUploadTile";
import { apiRequest } from "@/lib/queryClient";

interface Character {
  id: string;
  name: string;
  imageUrls: string[];
  toonUrl?: string;
  description?: string;
  character_type: "main" | "side";
  type: "predefined" | "custom";
}

interface SelectedCharacter {
  id: string;
  name: string;
  avatar: string;
  toonUrl?: string;
  description?: string;
}

interface SideCharacterSelectionProps {
  onSubmit: (characters: SelectedCharacter[]) => void;
  maxCharacters?: number;
  initialSelected?: SelectedCharacter[]; // NEW
}

export function SideCharacterSelection({
  onSubmit,
  maxCharacters = 3,
  initialSelected = [], // NEW
}: SideCharacterSelectionProps) {
  const [sideCharacters, setSideCharacters] = useState<Character[]>([]);
  const [selectedChars, setSelectedChars] =
    useState<SelectedCharacter[]>(initialSelected);
  const [loading, setLoading] = useState(true);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [tempAvatar, setTempAvatar] = useState<string>("");
  const [customName, setCustomName] = useState("");
  const [customDescription, setCustomDescription] = useState("");
  const [customRelation, setCustomRelation] = useState("");

  // Modal state for image viewing
  const [modalOpen, setModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState<{
    url: string;
    title: string;
  } | null>(null);

  const { toast } = useToast();

  const openImageModal = (url: string, title: string) => {
    setModalImage({ url, title });
    setModalOpen(true);
  };

  const closeImageModal = () => {
    setModalOpen(false);
    setModalImage(null);
  };

  // Fetch side characters on mount
  useEffect(() => {
    const fetchSideCharacters = async () => {
      try {
        const response = await fetch("/api/characters/by-character-type/side");
        if (response.ok) {
          const characters = await response.json();
          setSideCharacters(characters);
        } else {
          throw new Error("Failed to fetch side characters");
        }
      } catch (error) {
        console.error("Error fetching side characters:", error);
        toast({
          title: "Error",
          description: "Failed to load characters",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSideCharacters();
  }, [toast]);

  const toggleCharacter = (character: Character) => {
    const isSelected = selectedChars.find((c) => c.id === character.id);
    let newSelected;

    if (isSelected) {
      newSelected = selectedChars.filter((c) => c.id !== character.id);
    } else if (selectedChars.length < maxCharacters) {
      newSelected = [
        ...selectedChars,
        {
          id: character.id,
          name: character.name,
          avatar: character.imageUrls[0] || character.toonUrl || "",
          toonUrl: character.toonUrl,
          description: character.description || "",
        },
      ];
    } else {
      toast({
        title: "Maximum characters reached",
        description: `You can only select up to ${maxCharacters} characters`,
        variant: "destructive",
      });
      return;
    }
    setSelectedChars(newSelected);
    // Do NOT call onSubmit here; only call on button click below
  };

  const handleUpload = async (url: string) => {
    setUploading(false);
    setTempAvatar(url);
    setShowUploadForm(true);
  };

  const submitCustomCharacter = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customName.trim() || !customRelation.trim() || !tempAvatar) {
      toast({
        title: "Error",
        description: "Please provide a name, relationship, and upload an image",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiRequest("POST", "/api/characters", {
        name: customName,
        description: customRelation || customDescription,
        imageUrls: [tempAvatar],
        type: "side",
      });

      const createdChar: Character = {
        id: response.id,                // if your API already returns these,
        name: customName,               
        imageUrls: [tempAvatar],
        toonUrl: tempAvatar,
        description: customRelation || customDescription,
        character_type: "side",
        type: "custom",
      };
      setSideCharacters(prev => [...prev, createdChar]);

      const newCharacter: SelectedCharacter = {
        id: response.id,
        name: customName,
        avatar: tempAvatar,
        toonUrl: tempAvatar, // Use original image for now
        description: customRelation || customDescription,
      };

      if (selectedChars.length < maxCharacters) {
        setSelectedChars((prev) => [...prev, newCharacter]);
      }

      // Reset form
      setShowUploadForm(false);
      setTempAvatar("");
      setCustomName("");
      setCustomDescription("");
      setCustomRelation("");

      toast({
        title: "Success",
        description: "Character created and added to your story",
      });
    } catch (error) {
      console.error("Error creating character:", error);
      toast({
        title: "Error",
        description: "Failed to create character",
        variant: "destructive",
      });
    }
  };

  const handleNext = () => {
    onSubmit(selectedChars);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">Loading characters...</div>
      </div>
    );
  }

  return (
    <Card className="bg-transparent border-0 shadow-none">
      <CardContent className="bg-transparent p-0">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Choose Characters</h3>
            <p className="text-sm text-gray-600">
              Select up to {maxCharacters} additional characters for your story.
              You can choose from our collection or create your own.
            </p>
          </div>

          {/* Selected Characters */}
          {selectedChars.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm font-medium mb-2">
                Selected Characters ({selectedChars.length}/{maxCharacters}):
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedChars.map((char) => (
                  <div
                    key={char.id}
                    className="flex items-center gap-2 bg-white rounded-full px-3 py-1 border"
                  >
                    <div className="relative group">
                      <img
                        src={char.avatar}
                        alt={char.name}
                        className="w-6 h-6 rounded-full object-cover cursor-pointer"
                        onClick={() => openImageModal(char.avatar, char.name)}
                      />
                      <button
                        type="button"
                        onClick={() => openImageModal(char.avatar, char.name)}
                        className="absolute -bottom-1 -right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Expand image"
                      >
                        <i
                          className="fas fa-expand text-xs"
                          style={{ fontSize: "6px" }}
                        />
                      </button>
                    </div>
                    <span className="text-sm">{char.name}</span>
                    <button
                      onClick={() =>
                        setSelectedChars((prev) =>
                          prev.filter((c) => c.id !== char.id),
                        )
                      }
                      className="text-gray-500 hover:text-red-500 ml-1"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Character Grid */}
          {!showUploadForm && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {/* No characters option */}
              <div
                className={`cursor-pointer rounded-lg border p-4 text-center transition-colors ${
                  selectedChars.length === 0
                    ? "border-yellow-500 bg-yellow-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => setSelectedChars([])}
              >
                <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full border border-gray-300 flex items-center justify-center mb-2">
                  <span className="text-gray-400">—</span>
                </div>
                <p className="text-xs md:text-sm">No additional characters</p>
              </div>

              {/* Predefined characters */}
              {sideCharacters.map((character) => {
                const isSelected = selectedChars.find(
                  (c) => c.id === character.id,
                );
                return (
                  <div
                    key={character.id}
                    className={`cursor-pointer rounded-lg border p-4 text-center transition-colors ${
                      isSelected
                        ? "border-yellow-500 bg-yellow-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    onClick={() => toggleCharacter(character)}
                  >
                    <div className="relative group">
                      <img
                        src={character.imageUrls[0] || character.toonUrl || ""}
                        alt={character.name}
                        className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full object-cover mb-2"
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openImageModal(
                            character.imageUrls[0] || character.toonUrl || "",
                            character.name,
                          );
                        }}
                        className="absolute bottom-0 right-1/2 translate-x-1/2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label="Expand image"
                      >
                        <i className="fas fa-expand text-xs" />
                      </button>
                    </div>
                    <p className="text-xs md:text-sm font-medium">
                      {character.name}
                    </p>
                  </div>
                );
              })}

              {/* Upload new character */}
              {uploading ? (
                <div className="flex flex-col items-center justify-center border rounded-lg p-4">
                  <Progress value={uploadPct} className="w-full mb-2" />
                  <p className="text-xs text-gray-600">
                    {`Uploading ${Math.round(uploadPct)}%`}
                  </p>
                </div>
              ) : (
                <FileUploadTile
                  onUpload={handleUpload}
                  onStart={() => {
                    setUploading(true);
                    setUploadPct(0);
                  }}
                  onProgress={setUploadPct}
                />
              )}
            </div>
          )}

          {/* Custom Character Form */}
          {showUploadForm && (
            <div className="bg-gray-50 rounded-lg p-3 md:p-4">
              <div className="flex gap-3 md:gap-4 mb-4 justify-center md:justify-start">
                <div className="relative group">
                  <img
                    src={tempAvatar}
                    alt="Original"
                    className="w-16 h-16 md:w-20 md:h-20 rounded-lg object-cover cursor-pointer"
                    onClick={() => openImageModal(tempAvatar, "Original Photo")}
                  />
                  <button
                    type="button"
                    onClick={() => openImageModal(tempAvatar, "Original Photo")}
                    className="absolute bottom-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Expand image"
                  >
                    <i className="fas fa-expand text-xs" />
                  </button>
                </div>
              </div>

              <form onSubmit={submitCustomCharacter} className="space-y-3">
                <div>
                  <Label htmlFor="custom-name">Character Name</Label>
                  <Input
                    id="custom-name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Enter character name"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="custom-relation">
                    Relationship to main character
                  </Label>
                  <Input
                    id="custom-relation"
                    value={customRelation}
                    onChange={(e) => setCustomRelation(e.target.value)}
                    placeholder="e.g., best friend, older sister, pet dog, teacher"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="custom-description">
                    Additional Description (optional)
                  </Label>
                  <Input
                    id="custom-description"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    placeholder="Any additional details about the character"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-2">
                  <Button type="submit" size="sm" className="w-full md:w-auto">
                    Add Character
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full md:w-auto"
                    onClick={() => {
                      setShowUploadForm(false);
                      setTempAvatar("");
                      setCustomName("");
                      setCustomDescription("");
                      setCustomRelation("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Confirm Button restored */}
          {!(showUploadForm || uploading) && (
            <div className="flex justify-center md:justify-end mt-4">
              <Button
                onClick={() => onSubmit(selectedChars)}
                className="bg-yellow-500 hover:bg-yellow-600 w-full md:w-auto"
              >
                Continue to Choose Theme
              </Button>
            </div>
          )}
        </div>
      </CardContent>

      {/* Image Modal */}
      {modalOpen && modalImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
          onClick={closeImageModal}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={closeImageModal}
              className="absolute -top-2 -right-2 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
              aria-label="Close modal"
            >
              <i className="fas fa-times text-gray-600" />
            </button>
            <div className="bg-white rounded-lg p-4 shadow-xl">
              <h3 className="text-lg font-semibold mb-3 text-center">
                {modalImage.title}
              </h3>
              <img
                src={modalImage.url}
                alt={modalImage.title}
                className="max-w-full max-h-[70vh] object-contain mx-auto rounded-md"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
