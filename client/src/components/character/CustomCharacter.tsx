import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";

// Form schema
const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  age: z.coerce.number().min(1, "Age must be at least 1").max(15, "Age must be at most 15"),
  gender: z.enum(["boy", "girl", "other"], {
    required_error: "Please select a gender",
  }),
});

interface CustomCharacterProps {
  onSubmit: (character: {
    name: string;
    age: number;
    gender: string;
    type: 'custom';
    imageUrls: string[];
  }) => void;
}

export function CustomCharacter({ onSubmit }: CustomCharacterProps) {
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const { toast } = useToast();
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      age: 5,
      gender: "boy",
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    // Check max 10 images
    if (uploadedImages.length + files.length > 10) {
      toast({
        title: "Maximum images reached",
        description: "You can upload a maximum of 10 images",
        variant: "destructive",
      });
      return;
    }

    // Create mock image URLs (in a real app, these would be uploaded to a server)
    const newImages = Array.from(files).map((file) => {
      // In a real app, we would upload the file and get a URL
      // For this demo, we'll use a placeholder
      const imageSource = URL.createObjectURL(file);
      return imageSource;
    });

    setUploadedImages([...uploadedImages, ...newImages]);
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const handleSubmitForm = (values: z.infer<typeof formSchema>) => {
    if (uploadedImages.length === 0) {
      toast({
        title: "Images required",
        description: "Please upload at least one image of your character",
        variant: "destructive",
      });
      return;
    }

    onSubmit({
      ...values,
      type: 'custom',
      imageUrls: uploadedImages,
    });
  };

  return (
    <div className="mb-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <h3 className="text-xl font-heading font-bold mb-4">Create Your Custom Character</h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Character Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter character name" {...field} />
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
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
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
              
              <div>
                <FormLabel className="block mb-1">Upload Photos (up to 10)</FormLabel>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <div className="space-y-2">
                    <div className="flex justify-center">
                      <i className="fas fa-cloud-upload-alt text-4xl text-gray-400"></i>
                    </div>
                    <div className="text-sm text-gray-500">
                      <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary hover:text-primary/90">
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
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                </div>
              </div>
              
              {/* Preview Photos Grid */}
              {uploadedImages.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {uploadedImages.map((image, index) => (
                    <div key={index} className="relative h-24 bg-gray-100 rounded-md overflow-hidden">
                      <img 
                        src={image} 
                        className="w-full h-full object-cover" 
                        alt={`Uploaded photo ${index + 1}`} 
                      />
                      <button 
                        type="button"
                        className="absolute top-1 right-1 bg-white rounded-full p-1 shadow-sm"
                        onClick={() => removeImage(index)}
                      >
                        <i className="fas fa-times text-xs text-gray-500"></i>
                      </button>
                    </div>
                  ))}
                  {uploadedImages.length < 10 && (
                    <div className="h-24 border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                      <label htmlFor="add-more-photos" className="cursor-pointer w-full h-full flex items-center justify-center">
                        <i className="fas fa-plus text-gray-400"></i>
                        <input 
                          id="add-more-photos" 
                          type="file" 
                          className="sr-only" 
                          multiple 
                          accept="image/*" 
                          onChange={handleImageUpload}
                        />
                      </label>
                    </div>
                  )}
                </div>
              )}
              
              <Button type="submit" className="w-full">
                Next: Choose a Story
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
