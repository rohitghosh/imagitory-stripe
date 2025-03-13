// CustomCharacterForm.tsx
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

/* 
  Zod schema for validation:
  - name: required string
  - age: number between 1 and 15
  - gender: must be one of ["boy", "girl", "other"]
*/
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce
    .number()
    .min(1, "Age must be at least 1")
    .max(15, "Age must be at most 15"),
  gender: z.enum(["boy", "girl", "other"], {
    required_error: "Please select a gender",
  }),
});
interface UploadedImage {
  localUrl: string;
  finalUrl: string | null;
  uploading: boolean;
}

interface CustomCharacterFormProps {
  // Called when the character is successfully created
  onSubmit: (character: any) => void;
  // (Optional) If you want to let the user cancel and go back to carousel
  onCancel?: () => void;
}

export function CustomCharacterForm({
  onSubmit,
  onCancel,
}: CustomCharacterFormProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);

  // React Hook Form setup
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: 5,
      gender: "boy",
    },
  });

  // Handle file uploads to Firebase Storage
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (uploadedImages.length + files.length > 10) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 10 images",
        variant: "destructive",
      });
      return;
    }
    const filesArray = Array.from(files);
    const newPreviews: UploadedImage[] = filesArray.map((file) => ({
      localUrl: URL.createObjectURL(file),
      finalUrl: null,
      uploading: true,
    }));

    setUploadedImages((prev) => [...prev, ...newPreviews]);
    try {
      const storage = getStorage(); // your initialized Firebase app

      // Upload each file and update its corresponding object in state
      await Promise.all(
        filesArray.map(async (file, index) => {
          const timestamp = Date.now();
          const fileExtension = file.name.split(".").pop(); // extract file extension
          const fileNameWithoutExt = file.name.replace(/\.[^/.]+$/, ""); // remove existing extension

          const fileRef = ref(
            storage,
            `customCharacters/${fileNameWithoutExt}-${timestamp}.${fileExtension}`,
          );

          // const fileRef = ref(
          //   storage,
          //   `customCharacters/${file.name}-${Date.now()}`,
          // );
          await uploadBytes(fileRef, file);
          const finalUrl = await getDownloadURL(fileRef);

          // Update the corresponding preview object
          setUploadedImages((prevImages) => {
            const newImages = [...prevImages];
            // newPreviews were added at the end of prevImages
            const imageIndex = prevImages.length - newPreviews.length + index;
            newImages[imageIndex] = {
              localUrl: newImages[imageIndex].localUrl, // Keep the local preview
              finalUrl, // Set the final URL from Firebase
              uploading: false, // Mark as uploaded
            };
            return newImages;
          });
        }),
      );
    } catch (error) {
      console.error("Image upload error:", error);
      toast({
        title: "Upload Error",
        description: "Failed to upload image(s)",
        variant: "destructive",
      });
    }
  };

  // Remove a single image from preview
  const removeImage = (index: number) => {
    setUploadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  // Submit handler for the entire form
  const handleSubmitForm = async (values: z.infer<typeof formSchema>) => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image of your character",
        variant: "destructive",
      });
      return;
    }

    // Filter images to ensure all uploads are complete and URLs exist
    const validImageUrls = uploadedImages
      .filter((img) => !img.uploading && img.finalUrl)
      .map((img) => img.finalUrl) as string[];

    // Prepare payload for POST /api/characters
    const payload = {
      ...values,
      type: "custom",
      imageUrls: validImageUrls,
      userId: user?.uid || null,
      createdAt: new Date().toISOString(),
    };

    try {
      const newCharacter = await apiRequest("POST", "/api/characters", payload);
      // Return the new character object to parent
      onSubmit(newCharacter);
    } catch (error) {
      console.error("Failed to create custom character:", error);
      toast({
        title: "Error",
        description: "Failed to create custom character.",
        variant: "destructive",
      });
    }
  };

  const isUploading = uploadedImages.some((image) => image.uploading);

  return (
    <Card className="max-w-2xl mx-auto minimal-card">
      <CardContent className="p-6">
        <h3 className="text-xl font-heading font-bold mb-4">
          Create Your Custom Character
        </h3>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmitForm)}
            className="space-y-6"
          >
            {/* Name and Age fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Character Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter character name"
                        className="minimal-input"
                        {...field}
                      />
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
                    <FormLabel>Age</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter age"
                        min={1}
                        max={15}
                        className="minimal-input"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Gender radio buttons */}
            <FormField
              control={form.control}
              name="gender"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gender</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="boy" />
                        </FormControl>
                        <FormLabel className="font-normal">Boy</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="girl" />
                        </FormControl>
                        <FormLabel className="font-normal">Girl</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2">
                        <FormControl>
                          <RadioGroupItem value="other" />
                        </FormControl>
                        <FormLabel className="font-normal">Other</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image uploader */}
            <div>
              <FormLabel className="block mb-1">
                Upload Photos (up to 10)
              </FormLabel>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <div className="space-y-2">
                  <div className="flex justify-center">
                    <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                  </div>
                  <div className="text-sm text-gray-500">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90"
                    >
                      <span>Upload photos</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        multiple
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p>or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {/* Preview of uploaded images */}
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {uploadedImages.map((image, index) => (
                  <div
                    key={index}
                    className="relative h-24 bg-gray-100 rounded-md overflow-hidden"
                  >
                    <img
                      src={image.localUrl}
                      className="w-full h-full object-cover"
                      alt={`Uploaded photo ${index + 1}`}
                    />
                    {image.uploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                        <i className="fas fa-spinner fa-spin text-gray-500"></i>
                      </div>
                    )}
                    <button
                      type="button"
                      className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                      onClick={() => removeImage(index)}
                    >
                      <i className="fas fa-times text-xs text-gray-500"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action buttons: "Create" and optional "Cancel" */}
            <div className="flex justify-end space-x-4">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isUploading}
                className="bg-primary hover:bg-primary/90 text-white font-bold py-3 px-8 rounded-md shadow-sm hover:shadow-md transition-all"
              >
                Create Character
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
