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
import { Textarea } from "@/components/ui/textarea";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";

// Form schema
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  genre: z.string().min(1, "Genre is required"),
  instructions: z.string().min(1, "Instructions are required"),
  elements: z.array(z.string()).optional(),
});

interface CustomStoryProps {
  onSubmit: (story: {
    title: string;
    genre: string;
    instructions: string;
    elements: string[];
    type: 'custom';
  }) => void;
}

// Story elements options
const STORY_ELEMENTS = [
  { id: "talking-animals", label: "Talking animals" },
  { id: "magic-powers", label: "Magic powers" },
  { id: "friendship-themes", label: "Friendship themes" },
  { id: "educational-moments", label: "Educational moments" },
  { id: "adventure-quest", label: "Adventure quest" },
  { id: "moral-lesson", label: "Moral lesson" },
];

export function CustomStory({ onSubmit }: CustomStoryProps) {
  const [selectedElements, setSelectedElements] = useState<string[]>(["talking-animals", "friendship-themes"]);
  
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      genre: "",
      instructions: "",
      elements: selectedElements,
    },
  });

  const toggleElement = (elementId: string) => {
    setSelectedElements(prev => 
      prev.includes(elementId)
        ? prev.filter(id => id !== elementId)
        : [...prev, elementId]
    );
  };

  const handleSubmitForm = (values: z.infer<typeof formSchema>) => {
    onSubmit({
      ...values,
      elements: selectedElements,
      type: 'custom',
    });
  };

  return (
    <div className="mb-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <h3 className="text-xl font-heading font-bold mb-4">Create Your Custom Story</h3>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmitForm)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter a title for your story" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="genre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Genre</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a genre" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="adventure">Adventure</SelectItem>
                        <SelectItem value="fantasy">Fantasy</SelectItem>
                        <SelectItem value="science-fiction">Science Fiction</SelectItem>
                        <SelectItem value="educational">Educational</SelectItem>
                        <SelectItem value="everyday-life">Everyday Life</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Instructions</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Describe what you want the story to be about. Include any specific elements you'd like to include."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div>
                <FormLabel className="block text-sm font-medium text-gray-700 mb-1">Story Elements</FormLabel>
                <div className="grid grid-cols-2 gap-3">
                  {STORY_ELEMENTS.map((element) => (
                    <div key={element.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={element.id}
                        checked={selectedElements.includes(element.id)}
                        onCheckedChange={() => toggleElement(element.id)}
                      />
                      <label
                        htmlFor={element.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                      >
                        {element.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
              
              <Button type="submit" className="w-full">
                Next: Preview Story
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
