import { useState, useMemo, useEffect } from "react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, getDay, isToday } from "date-fns";
import { ChevronLeft, ChevronRight, X, Download, Eye, Wand2, ShoppingBag, Scissors, Calendar as CalendarIcon, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type CalendarCount = {
  date: string;
  count: number;
  type: string;
};

type ImageType = {
  id: string;
  imageUrl: string;
  prompt: string;
  generationType: string;
  createdAt: string;
  isFavorite: boolean;
};

interface CalendarHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const UGLI_RUST = "#ed5387";

const getActivityColor = (count: number, maxCount: number): string => {
  if (count === 0) return "transparent";
  const intensity = Math.min(count / Math.max(maxCount, 1), 1);
  if (intensity < 0.25) return "rgba(233, 30, 99, 0.2)";
  if (intensity < 0.5) return "rgba(233, 30, 99, 0.4)";
  if (intensity < 0.75) return "rgba(233, 30, 99, 0.7)";
  return UGLI_RUST;
};

const getTypeConfig = (type: string) => {
  switch (type) {
    case "image": return { icon: Wand2, color: "#7C3AED", label: "Image" };
    case "mockup": return { icon: ShoppingBag, color: "#4F46E5", label: "Mockup" };
    case "bg-removed": return { icon: Scissors, color: "#EC4899", label: "BG Removed" };
    default: return { icon: Star, color: "#71717A", label: "Unknown" };
  }
};

export function CalendarHistoryModal({ open, onOpenChange }: CalendarHistoryModalProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth() + 1;

  const { data: calendarData, isLoading: isLoadingCalendar } = useQuery({
    queryKey: ["calendar", year, month],
    queryFn: async () => {
      const res = await fetch(`/api/images/calendar?year=${year}&month=${month}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch calendar data");
      const data = await res.json();
      return data.counts as CalendarCount[];
    },
    enabled: open,
  });

  const { data: selectedDateImages, isLoading: isLoadingImages } = useQuery({
    queryKey: ["images-by-date", selectedDate?.toISOString()],
    queryFn: async () => {
      if (!selectedDate) return [];
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      const res = await fetch(`/api/images/by-date?date=${dateStr}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch images");
      const data = await res.json();
      return data.images as ImageType[];
    },
    enabled: !!selectedDate && open,
  });

  const countsByDate = useMemo(() => {
    const map: Record<string, number> = {};
    if (calendarData) {
      for (const entry of calendarData) {
        map[entry.date] = (map[entry.date] || 0) + entry.count;
      }
    }
    return map;
  }, [calendarData]);

  const maxCount = useMemo(() => {
    return Math.max(...Object.values(countsByDate), 1);
  }, [countsByDate]);

  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const firstDayOfWeek = getDay(startOfMonth(currentMonth));

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast({ title: "Download Complete", description: "Image saved to your device." });
    } catch {
      toast({ variant: "destructive", title: "Download Failed", description: "Could not download image." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-white dark:bg-[#18181B] border-[#E4E4E7] dark:border-[#27272A] overflow-hidden">
        <div className="flex h-full max-h-[85vh]">
          <div className={cn(
            "flex flex-col transition-all duration-300",
            selectedDate ? "w-1/2 border-r border-[#E4E4E7] dark:border-[#27272A]" : "w-full"
          )}>
            <DialogHeader className="p-6 pb-4 border-b border-[#E4E4E7] dark:border-[#27272A]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-[#ed5387]/10 rounded-lg">
                    <CalendarIcon className="h-5 w-5 text-[#ed5387]" />
                  </div>
                  <DialogTitle className="text-xl font-semibold text-[#18181B] dark:text-[#FAFAFA]">
                    Generation History
                  </DialogTitle>
                </div>
              </div>
            </DialogHeader>

            <div className="p-6 flex-1 overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="h-9 w-9 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA]"
                  data-testid="button-prev-month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-lg font-semibold text-[#18181B] dark:text-[#FAFAFA]" data-testid="text-current-month">
                  {format(currentMonth, "MMMM yyyy")}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="h-9 w-9 text-[#71717A] hover:text-[#18181B] dark:hover:text-[#FAFAFA]"
                  data-testid="button-next-month"
                >
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="text-center text-xs font-medium text-[#71717A] py-2">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square" />
                ))}
                {days.map((day) => {
                  const dateKey = format(day, "yyyy-MM-dd");
                  const count = countsByDate[dateKey] || 0;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isTodayDate = isToday(day);

                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      disabled={isLoadingCalendar}
                      data-testid={`button-day-${dateKey}`}
                      className={cn(
                        "aspect-square rounded-lg flex flex-col items-center justify-center relative transition-all",
                        "hover:ring-2 hover:ring-[#ed5387]/50",
                        isSelected && "ring-2 ring-[#ed5387]",
                        isTodayDate && "font-bold",
                        count > 0 && "cursor-pointer"
                      )}
                      style={{
                        backgroundColor: getActivityColor(count, maxCount),
                      }}
                    >
                      <span className={cn(
                        "text-sm",
                        count > 0 ? "text-[#18181B] dark:text-[#FAFAFA]" : "text-[#71717A]",
                        isTodayDate && "underline"
                      )}>
                        {format(day, "d")}
                      </span>
                      {count > 0 && (
                        <span className="text-[10px] text-[#18181B]/70 dark:text-[#FAFAFA]/70">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 pt-4 border-t border-[#E4E4E7] dark:border-[#27272A]">
                <p className="text-xs text-[#71717A] mb-3">Activity Levels</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#71717A]">Less</span>
                  <div className="flex gap-1">
                    {[0, 0.25, 0.5, 0.75, 1].map((level, i) => (
                      <div
                        key={i}
                        className="w-4 h-4 rounded"
                        style={{
                          backgroundColor: level === 0 
                            ? "rgba(233, 30, 99, 0.1)" 
                            : getActivityColor(level * 10, 10),
                        }}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-[#71717A]">More</span>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {selectedDate && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: "50%", opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col overflow-hidden"
              >
                <div className="p-4 border-b border-[#E4E4E7] dark:border-[#27272A] flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-[#18181B] dark:text-[#FAFAFA]" data-testid="text-selected-date">
                      {format(selectedDate, "MMMM d, yyyy")}
                    </h3>
                    <p className="text-sm text-[#71717A]">
                      {selectedDateImages?.length || 0} generations
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedDate(null)}
                    className="h-8 w-8"
                    data-testid="button-close-panel"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-4">
                  {isLoadingImages ? (
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2, 3, 4].map((i) => (
                        <Skeleton key={i} className="aspect-square rounded-lg" />
                      ))}
                    </div>
                  ) : selectedDateImages && selectedDateImages.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {selectedDateImages.map((image) => {
                        const typeConfig = getTypeConfig(image.generationType);
                        return (
                          <div
                            key={image.id}
                            className="group relative aspect-square rounded-lg overflow-hidden bg-[#F4F4F5] dark:bg-[#27272A]"
                            data-testid={`card-image-${image.id}`}
                          >
                            <img
                              src={image.imageUrl}
                              alt={image.prompt}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <div className="flex items-center gap-1 mb-1">
                                  <Badge 
                                    className="text-[10px] px-1.5 py-0.5"
                                    style={{ backgroundColor: typeConfig.color }}
                                  >
                                    {typeConfig.label}
                                  </Badge>
                                </div>
                                <p className="text-[10px] text-white/80 line-clamp-2">
                                  {image.prompt}
                                </p>
                              </div>
                              <div className="absolute top-2 right-2 flex gap-1">
                                <Button
                                  size="icon"
                                  variant="secondary"
                                  className="h-7 w-7 bg-white/90 hover:bg-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(image.imageUrl, `image-${image.id}.png`);
                                  }}
                                  data-testid={`button-download-${image.id}`}
                                >
                                  <Download className="h-3.5 w-3.5 text-[#18181B]" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                      <div className="w-16 h-16 bg-[#F4F4F5] dark:bg-[#27272A] rounded-full flex items-center justify-center mb-4">
                        <CalendarIcon className="h-8 w-8 text-[#71717A]" />
                      </div>
                      <p className="text-[#71717A]">No images on this date</p>
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
