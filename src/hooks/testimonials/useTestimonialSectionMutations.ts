"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "@/lib/admin/api";
import { useToast } from "@/hooks/shared/use-toast";
import type { TestimonialSection } from "@/types/testimonial";

export function useTestimonialSectionMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const saveSectionAssignments = useMutation({
    mutationFn: ({
      section,
      ids,
    }: {
      section: TestimonialSection;
      ids: string[];
    }) => adminApi.put(`/api/admin/testimonial-sections/${section}`, { testimonialIds: ids }),
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
