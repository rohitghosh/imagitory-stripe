// src/components/character/CustomCharacterForm.tsx
import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
} from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Progress } from "@/components/ui/progress";

// allowed interests
const INTEREST_OPTIONS = [
  "Reading",
  "Sports",
  "Music",
  "Art",
  "Science",
] as const;

export const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Min age is 1").max(16, "Max age is 16"),
  gender: z.enum(["boy", "girl", "other"], { required_error: "Select gender" }),
  interests: z
    .array(z.enum(INTEREST_OPTIONS))
    .min(1, "Select at least one interest"),
});
export type FormValues = z.infer<typeof formSchema>;

interface UploadedImage {
  localUrl: string;
  finalUrl: string | null;
  uploading: boolean;
}

interface CustomCharacterFormProps {
  onSubmit: (character: any) => void;
  onCancel?: () => void;
  initialData?: Partial<FormValues> & { imageUrls?: string[]; id?: string };
  autoOpenUpload?: boolean;
}

export function CustomCharacterForm({
  onSubmit,
  onCancel,
  initialData,
  autoOpenUpload = false,
}: CustomCharacterFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadToken = useRef(0);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name ?? "",
      age: initialData?.age ?? 5,
      gender: initialData?.gender ?? "boy",
      interests: initialData?.interests ?? [],
    },
  });

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [step, setStep] = useState<"upload" | "details">("upload");
  const [cartoonPending, setCartoonPending] = useState(false);
  const [cartoonUrl, setCartoonUrl] = useState<string | null>(null);
  const [progressPct, setProgressPct] = useState(0);
  const [draftChar, setDraftChar] = useState<{
    id: string;
    imageUrls: string[];
  } | null>(
    initialData && initialData.id
      ? { id: initialData.id, imageUrls: initialData.imageUrls || [] }
      : null,
  );

  const removePhoto = () => {
    uploadToken.current += 1;
    setUploadedImages([]);
    setCartoonUrl(null);
    setCartoonPending(false);
    setStep("upload");
    setProgressPct(0);
  };

  // seed previews when editing
  useEffect(() => {
    if (initialData?.imageUrls) {
      setUploadedImages(
        initialData.imageUrls.map((url) => ({
          localUrl: url,
          finalUrl: url,
          uploading: false,
        })),
      );
      if (initialData.imageUrls.length > 0) {
        setStep("details");
      }
    }
  }, [initialData]);

  // advance to details once any image finishes uploading
  useEffect(() => {
    if (
      step === "upload" &&
      uploadedImages.some((img) => img.finalUrl && !img.uploading)
    ) {
      setStep("details");
    }
  }, [uploadedImages, step]);

  // auto-open file picker on first render of upload step
  useEffect(() => {
    if (autoOpenUpload && step === "upload") {
      fileInputRef.current?.click();
    }
  }, [autoOpenUpload, step]);

  async function uploadFile(file: File): Promise<string> {
    const ts = Date.now();
    const ext = file.name.split(".").pop();
    const base = file.name.replace(/\.[^/.]+$/, "");
    const storageRef = getStorage();
    const fileRef = ref(storageRef, `customCharacters/${base}-${ts}.${ext}`);
    return new Promise((resolve, reject) => {
      const task = uploadBytesResumable(fileRef, file);
      task.on(
        "state_changed",
        (snap) => {
          setProgressPct((snap.bytesTransferred / snap.totalBytes) * 100);
        },
        (err) => reject(err),
        async () => resolve(await getDownloadURL(task.snapshot.ref)),
      );
    });
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const thisToken = ++uploadToken.current;
    const arr = [file];
    const previews = arr.map((file) => ({
      localUrl: URL.createObjectURL(file),
      finalUrl: null as string | null,
      uploading: true,
    }));
    setUploadedImages((prev) => [...prev, ...previews]);

    try {
      // STEP A: upload first file
      const firstFile = arr[0];
      const firstUrl = await uploadFile(firstFile);
      if (uploadToken.current !== thisToken) return;
      setUploadedImages((prev) => {
        const cp = [...prev];
        cp[prev.length - arr.length] = {
          localUrl: cp[prev.length - arr.length].localUrl,
          finalUrl: firstUrl,
          uploading: false,
        };
        return cp;
      });

      let charId = draftChar?.id;
      if (!charId) {
        const draft = await apiRequest("POST", "/api/characters", {
          imageUrls: [firstUrl],
          type: "custom",
          userId: user!.uid,
          name: "__DRAFT__",
        });
        charId = draft.id;
        setDraftChar({ id: draft.id, imageUrls: draft.imageUrls });
      }

      // STEP B: cartoonify
      setCartoonPending(true);
      const { toonUrl } = await apiRequest("POST", "/api/cartoonify", {
        characterId: charId,
        imageUrl: firstUrl,
      });
      if (uploadToken.current !== thisToken) return;
      setUploadedImages((prev) => {
        const idx = prev.findIndex((i) => i.finalUrl === firstUrl);
        const before = prev.slice(0, idx + 1);
        const after = prev.slice(idx + 1);

        return [
          ...before,
          { localUrl: toonUrl, finalUrl: toonUrl, uploading: false },
          ...after,
        ];
      });
      setCartoonUrl(toonUrl);
      setCartoonPending(false);

      // STEP C: upload the rest in parallel
      const rest = arr.slice(1);
      await Promise.all(
        rest.map(async (file, i) => {
          const url = await uploadFile(file);
          if (uploadToken.current !== thisToken) return;
          setUploadedImages((prev) => {
            const cp = [...prev];
            const slot = prev.length - rest.length + i;
            cp[slot] = {
              localUrl: cp[slot].localUrl,
              finalUrl: url,
              uploading: false,
            };
            return cp;
          });
        }),
      );
    } catch {
      toast({
        title: "Upload failed",
        description: "Could not upload images",
        variant: "destructive",
      });
    }
  };

  const isUploading = uploadedImages.some((i) => i.uploading);

  const onSubmitForm = form.handleSubmit(async (values) => {
    const urls = uploadedImages
      .filter((i) => !i.uploading && i.finalUrl)
      .map((i) => i.finalUrl!);

    if (!urls.length) {
      toast({
        title: "Images required",
        description: "Upload at least one",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...values,
      imageUrls: urls,
      type: "custom",
      userId: user!.uid,
      createdAt: initialData?.id ? undefined : new Date().toISOString(),
    };

    try {
      const result = draftChar
        ? await apiRequest("PUT", `/api/characters/${draftChar.id}`, payload)
        : await apiRequest("POST", "/api/characters", payload);

      toast({ title: "Saved", description: "Character is ready." });
      onSubmit(result);
    } catch {
      toast({
        title: "Error",
        description: "Could not save character",
        variant: "destructive",
      });
    }
  });

  return (
    <Card className="w-full max-w-2xl mx-auto overflow-hidden">
      <CardContent className="px-4 py-6 sm:px-6 sm:py-8">
        <h3 className="text-xl font-bold mb-6">
          {initialData?.id ? "Edit Character" : "Create Your Character"}
        </h3>

        {/* STEP 1: Upload */}
        {step === "upload" && (
          <>
            <>
              <p className="font-semibold mb-2 text-center text-imaginory-black">
                Upload Photo
              </p>
              <ul className="text-xs text-imaginory-black mt-2 space-y-1">
                <li>✓ Well-lit, front-facing photo</li>
                <li>✓ Only the child in frame</li>
                <li>✗ No filters or heavy shadows</li>
                <li>✗ Avoid blurred / low-res images</li>
              </ul>
              <div className="border-2 border-dashed rounded-lg p-4 sm:p-6 text-center mb-4">
                <button
                  type="button"
                  className="text-imaginory-black cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Select Photo
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={handleImageUpload}
                />
              </div>
            </>

            {isUploading && (
              <div className="mb-4">
                <Progress value={progressPct} />
                <p className="text-center text-xs text-imaginory-black mt-1">
                  Uploading… {Math.round(progressPct)}%
                </p>
              </div>
            )}
          </>
        )}

        {/* STEP 2: Details */}
        {step === "details" && (
          <>
            <div className="flex flex-col sm:flex-row gap-4 mb-6 items-start sm:items-center">
              <h4 className="text-lg font-semibold">
                Here’s how your cartoon avatar will look:
              </h4>
              <div className="relative">
                <img
                  src={
                    uploadedImages.find((i) => i.finalUrl && !i.uploading)!
                      .localUrl
                  }
                  alt="Original"
                  className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-md border"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow"
                  aria-label="Remove"
                >
                  <i className="fas fa-times text-xs text-gray-500" />
                </button>
              </div>
              {cartoonPending && !cartoonUrl ? (
                <div className="h-20 w-20 sm:h-24 sm:w-24 flex items-center justify-center border rounded-md">
                  <i className="fas fa-spinner fa-spin text-gray-500 text-xl" />
                </div>
              ) : cartoonUrl ? (
                <img
                  src={cartoonUrl}
                  alt="Cartoon"
                  className="h-20 w-20 sm:h-24 sm:w-24 object-cover rounded-md border"
                />
              ) : null}
            </div>

            <Form {...form}>
              <form onSubmit={onSubmitForm} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Child’s name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age: {field.value}</FormLabel>
                      <FormControl>
                        <Slider
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          min={1}
                          max={16}
                          step={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gender</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="flex flex-wrap gap-4"
                        >
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="boy" />
                            </FormControl>
                            <FormLabel>Boy</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="girl" />
                            </FormControl>
                            <FormLabel>Girl</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2">
                            <FormControl>
                              <RadioGroupItem value="other" />
                            </FormControl>
                            <FormLabel>Other</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests</FormLabel>
                      <FormControl>
                        <ToggleGroup
                          type="multiple"
                          value={field.value}
                          onValueChange={field.onChange}
                          className="flex flex-wrap gap-2"
                        >
                          {INTEREST_OPTIONS.map((opt) => (
                            <ToggleGroupItem
                              key={opt}
                              value={opt}
                              className="px-3 py-1 border rounded cursor-pointer"
                            >
                              {opt}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  {onCancel && (
                    <Button variant="outline" onClick={onCancel}>
                      Cancel
                    </Button>
                  )}
                  <Button
                    type="submit"
                    disabled={isUploading || cartoonPending || !cartoonUrl}
                  >
                    {initialData?.id ? "Save Changes" : "Create Character"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </CardContent>
    </Card>
  );
}
