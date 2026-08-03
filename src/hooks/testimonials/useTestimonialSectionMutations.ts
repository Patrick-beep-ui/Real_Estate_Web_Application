"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/shared/use-toast";
import type { TestimonialSection } from "@/types/testimonial";

export function useTestimonialSectionMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveSectionAssignments = useMutation({
    mutationFn: async ({
      section,
      ids,
    }: {
      section: TestimonialSection;
      ids: string[];
    }) => {
      const { error: delError } = await supabase
        .from("testimonial_section_assignments")
        .delete()
        .eq("section", section);
      if (delError) throw delError;
      if (ids.length === 0) return;
      const { error: insError } = await supabase
        .from("testimonial_section_assignments")
        .insert(
          ids.map((testimonial_id, sort_order) => ({
            section,
            testimonial_id,
            sort_order,
          })),
        );
      if (insError) throw insError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["testimonial-section-assignments"],
      });
      queryClient.invalidateQueries({ queryKey: ["testimonials", "section"] });
      toast({ title: "Section saved" });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: (err as Error).message,
      });
    },
  });

  return { saveSectionAssignments };
}
