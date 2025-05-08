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
import { Checkbox } from "@/components/ui/checkbox";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";

// Form schema remains the same.
const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  instructions: z.string().min(1, "Instructions are required"),
  moral: z.string().min(1, "Moral is required"),
  rhyming: z.boolean().optional(),
  theme: z
    .enum([
      "adventure-quest",
      "magical-discovery",
      "friendship-tale",
      "bedtime-comfort",
      "mystery-solving",
      "big-day-story",
      "imagination-play",
      "none",
    ])
    .optional(),
});

// Updated theme options with the new descriptions.
const themeOptions = [
  {
    value: "adventure-quest",
    label: "Adventure Quest",
    description:
      "A journey to overcome obstacles, solve a problem, or find something important",
  },
  {
    value: "magical-discovery",
    label: "Magical Discovery",
    description: "A hidden world or secret is revealed in an ordinary setting",
  },
  {
    value: "friendship-tale",
    label: "Friendship Tale",
    description:
      "A heartwarming story about meeting, helping, or reconnecting with a friend",
  },
  {
    value: "bedtime-comfort",
    label: "Bedtime Comfort",
    description: "A gentle, cozy narrative that soothes and reassures",
  },
  {
    value: "mystery-solving",
    label: "Mystery Solving",
    description:
      "A curious hero investigates or uncovers a fun or magical secret",
  },
  {
    value: "big-day-story",
    label: "Big Day Story",
    description:
      "A special milestone like a birthday, school event, or personal achievement",
  },
  {
    value: "imagination-play",
    label: "Imagination Play",
    description:
      "A surreal or pretend adventure that may blur the lines between real and imagined",
  },
  {
    value: "none",
    label: "No Special Theme",
    description: "Stick with a classic narrative without extra embellishments.",
  },
];

// A simple radio group for theme selection.
function ThemeRadioGroup({ selectedValue, onChange }) {
  return (
    <div className="space-y-4">
      {themeOptions.map((option) => (
        <label
          key={option.value}
          className={`cursor-pointer block p-4 border rounded-md shadow-sm transition 
            ${selectedValue === option.value ? "border-green-500 bg-green-50" : "border-gray-300"}`}
        >
          <div className="flex items-center">
            <input
              type="radio"
              name="theme"
              value={option.value}
              checked={selectedValue === option.value}
              onChange={() => onChange(option.value)}
              className="mr-3"
            />
            <div>
              <div className="font-bold">{option.label}</div>
              <div className="text-sm text-gray-600">{option.description}</div>
            </div>
          </div>
        </label>
      ))}
    </div>
  );
}

interface CustomStoryProps {
  onSubmit: (story: {
    id: string;
    title: string;
    instructions: string;
    type: "custom";
    moral: string;
    rhyming: boolean;
    theme: string;
  }) => void;
}

export function CustomStory({ onSubmit }: CustomStoryProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      instructions: "",
      moral: "",
      rhyming: false,
      theme: "none",
    },
  });

  // Watch the theme field to know which option is selected.
  const themeValue = form.watch("theme");

  const handleSubmitForm = async (values: z.infer<typeof formSchema>) => {
    const payload = { ...values, type: "custom" };
    try {
      const createdStory = await apiRequest("POST", "/api/stories", payload);
      onSubmit(createdStory);
    } catch (error) {
      console.error("Failed to create custom story", error);
    }
  };

  return (
    <div className="mb-8">
      <Card className="max-w-2xl mx-auto">
        <CardContent className="p-6">
          <h3 className="text-xl font-heading font-bold mb-4">
            Create Your Custom Story
          </h3>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleSubmitForm)}
              className="space-y-6"
            >
              {/* Story Title Field */}
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Title</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter a title for the story..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Story Instructions Field */}
              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Instructions</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe what you want the story to be about..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Moral Field */}
              <FormItem>
                <FormLabel>Moral of the Story</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Enter the moral you'd like the story to convey"
                    className="min-h-[60px]"
                    onChange={(e) => form.setValue("moral", e.target.value)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>

              {/* Rhyming Checkbox */}
              <FormField
                control={form.control}
                name="rhyming"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox
                        checked={field.value || false}
                        onCheckedChange={(checked) =>
                          field.onChange(Boolean(checked))
                        }
                        id="rhyming"
                      />
                      <FormLabel
                        htmlFor="rhyming"
                        className="text-sm font-medium"
                      >
                        Make this a rhyming story?
                      </FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {/* Theme Selection via Radio Group */}
              <FormField
                control={form.control}
                name="theme"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Story Theme (Optional)</FormLabel>
                    <FormControl>
                      <ThemeRadioGroup
                        selectedValue={themeValue}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
