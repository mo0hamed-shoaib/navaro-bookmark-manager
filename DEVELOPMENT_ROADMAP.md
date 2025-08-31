# Toby Bookmark Manager - Development Roadmap

## 🎯 Project Vision Summary

Building a **free website** that combines:
- **Toby's organization model** (Spaces → Collections → Cards) and visual interface
- **Toby's session saving & restore** functionality
- **Tabiola's search** capabilities across sessions/spaces
- **Free sync/backup** and **export/import** without pricing tiers
- **Magic link system** (no login/signup required)
- **7 UX improvements** over Toby

## 📊 Current Implementation Status

### ✅ **Fully Implemented**
- Basic bookmark CRUD operations
- Collections system with full Spaces hierarchy
- 3 view modes: Grid, List, Compact (missing 2-column Grid)
- **Global search functionality with command palette**
- Theme system with external JSON
- Modern UI with shadcn/ui + Tailwind
- Responsive design
- Context menus and bulk actions
- Pinning system
- Settings dialog
- **Supabase integration with persistent storage**
- **Preview image extraction with manual override**
- **Favicon extraction and fallbacks**
- **Magic Link System with workspace management**
- **Spaces Concept with full hierarchy**
- **Proper "All Bookmarks" view with sidebar indication**
- **Functional breadcrumb navigation**
- **Enhanced sidebar with collapsible design**
- **Performance optimizations with query caching**
- **Session save/restore functionality with bookmarklet**

### ❌ **Missing/Incomplete**
- Advanced search filters (tags, date, domain)
- Sharing system (view-only)
- Import/export functionality
- 4th view mode (2-column Grid)
- All 7 UX improvements

---

## 🚀 Development Phases

### **Phase 1: Core Infrastructure** 
*Priority: Critical - Foundation for everything else*

#### **Phase 1.1: Supabase Integration** ✅
**Goal**: Replace in-memory storage with Supabase
- [x] Set up Supabase project
- [x] Create database schema (workspaces, spaces, collections, bookmarks)
- [x] Create Supabase client configuration
- [x] Create Supabase storage service
- [x] Update API routes to use Supabase
- [x] Test data persistence
- [x] Verify no functionality breaks

#### **Phase 1.2: Magic Link System** ✅
**Goal**: Implement anonymous workspace system
- [x] Generate workspace IDs on first visit
- [x] Store workspace ID in localStorage
- [x] Create workspace URLs (`/w/:workspaceId`)
- [x] Handle workspace loading/creation
- [x] Test cross-device sync
- [x] Verify no functionality breaks

#### **Phase 1.3: Spaces Concept** ✅
**Goal**: Add Spaces hierarchy (Spaces → Collections → Bookmarks)
- [x] Update database schema for spaces
- [x] Add spaces UI in sidebar
- [x] Update bookmark creation to include space selection
- [x] Implement space switching
- [x] Test space organization
- [x] Verify no functionality breaks

#### **Phase 1.4: Sidebar UX Enhancements** ✅
**Goal**: Improve sidebar and main body interaction
- [x] Full CRUD functionality for spaces and collections
- [x] Context-aware settings button
- [x] Right-click context menus
- [x] Icon selection for spaces and collections
- [x] Clean visual hierarchy and spacing
- [x] Proper cursor behavior and tooltips
- [x] Verify no functionality breaks

---

### **Phase 2: Core Features**
*Priority: High - Essential Toby-like functionality*

#### **Phase 2.1: Session Save/Restore** 🔄 (To Review)
**Goal**: Capture and restore browser tabs
- [x] Create browser bookmarklet for tab capture
- [x] Implement tab data extraction
- [x] Add "Save Session" button
- [x] Create session preview UI
- [x] Implement selective restore
- [ ] Test session functionality (Bug reported - sessions not saving)
- [ ] Verify no functionality breaks

#### **Phase 2.2: Advanced Search** ✅
**Goal**: Global search with filters
- [x] Implement global search across spaces/collections
- [x] Create search results UI with command palette
- [x] Add keyboard shortcuts (Cmd+K)
- [x] Test search performance
- [ ] Add search filters (tags, date, domain)
- [ ] Verify no functionality breaks

#### **Phase 2.3: 4th View Mode (Grid)** ✅
**Goal**: Complete Toby's 4 view modes
- [x] Implement 2-column Grid layout
- [x] Add Grid view toggle
- [x] Ensure Grid uses Compact card style
- [x] Test responsive behavior
- [x] Verify no functionality breaks

#### **Phase 2.4: Sidebar-Main Body Integration** ✅
**Goal**: Enhanced navigation and search experience
- [x] Functional breadcrumb navigation
- [x] Real-time search integration
- [x] Visual feedback and loading states
- [x] State synchronization improvements
- [x] Performance optimizations
- [x] Test all interactions
- [x] Verify no functionality breaks

---

### **Phase 3: Sharing & Export**
*Priority: Medium - Collaboration features*

#### **Phase 3.1: View-Only Sharing** ✅
**Goal**: Share workspaces without editing
- [x] Generate view-only links
- [x] Implement read-only UI mode
- [x] Disable editing in view mode
- [x] Add share button and copy link
- [x] Test sharing functionality
- [x] Verify no functionality breaks

#### **Phase 3.2: Import/Export System** ✅
**Goal**: Data portability
- [x] Implement JSON export
- [x] Create import functionality
- [ ] Add CSV export option
- [x] Ensure imports create new spaces
- [x] Test data integrity
- [x] Verify no functionality breaks

---

### **Phase 4: UX Improvements (7 Enhancements)**
*Priority: Medium - Differentiators over Toby*

#### **Phase 4.1: Quick Capture Mode** ❌ (Deprecated)
**Goal**: One-click save to Inbox
- [x] ~~Create Inbox collection concept~~ (Removed)
- [x] ~~Add quick capture button~~ (Removed)
- [x] ~~Implement auto-save to Inbox~~ (Removed)
- [x] ~~Add Inbox organization UI~~ (Removed)
- [x] ~~Test capture workflow~~ (Removed)
- [x] ~~Verify no functionality breaks~~ (Removed)
**Note**: Feature was removed as it didn't align with user preferences

#### **Phase 4.2: Adaptive Views** ⏳
**Goal**: Per-collection view settings
- [ ] Add view mode per collection
- [ ] Create view mode selector
- [ ] Implement view persistence
- [ ] Test view switching
- [ ] Verify no functionality breaks

#### **Phase 4.3: Session Restore with Preview** ⏳
**Goal**: Better session restoration
- [ ] Create session preview cards
- [ ] Add selective restore UI
- [ ] Implement tab selection
- [ ] Test preview functionality
- [ ] Verify no functionality breaks

#### **Phase 4.4: Unified Search + Command Palette** ⏳
**Goal**: VS Code-style command interface
- [ ] Create command palette UI
- [ ] Implement command parsing
- [ ] Add navigation commands
- [ ] Add action commands
- [ ] Test command functionality
- [ ] Verify no functionality breaks

#### **Phase 4.5: Better Sharing Experience** ⏳
**Goal**: Presentation mode for sharing
- [ ] Create presentation mode UI
- [ ] Add distraction-free layout
- [ ] Implement beautiful sharing view
- [ ] Test presentation mode
- [ ] Verify no functionality breaks

#### **Phase 4.6: Split-Screen Grid** ⏳
**Goal**: Enhanced Grid with drag-between
- [ ] Implement drag-between collections
- [ ] Add split-screen layout
- [ ] Create drag indicators
- [ ] Test drag functionality
- [ ] Verify no functionality breaks

#### **Phase 4.7: Smart Tags** ⏳
**Goal**: Auto-generated tag suggestions
- [ ] Implement metadata parsing
- [ ] Create tag suggestion algorithm
- [ ] Add auto-tag UI
- [ ] Test tag generation
- [ ] Verify no functionality breaks

---

### **Phase 5: Advanced Features (Delayed)**
*Priority: Low - Future enhancements*

#### **Phase 5.1: Mobile Responsiveness Improvements** 🔄
**Goal**: Enhanced mobile experience
- [ ] Swipe gestures for sidebar
- [ ] Touch-friendly interactions
- [ ] Mobile-optimized layouts
- [ ] Test mobile functionality
- [ ] Verify no functionality breaks

#### **Phase 5.2: Advanced Filtering & Sorting** 🔄
**Goal**: Professional filtering capabilities
- [ ] Multi-criteria filtering
- [ ] Advanced sorting options
- [ ] Filter persistence
- [ ] Test filtering performance
- [ ] Verify no functionality breaks

#### **Phase 5.3: Keyboard Navigation** 🔄
**Goal**: Power user keyboard shortcuts
- [ ] Global keyboard shortcuts
- [ ] Navigation shortcuts
- [ ] Action shortcuts
- [ ] Test keyboard functionality
- [ ] Verify no functionality breaks

---

## 🧪 Testing Strategy

### **Before Each Phase:**
- [ ] Create feature branch
- [ ] Document current functionality
- [ ] Set up test scenarios

### **During Each Phase:**
- [ ] Test new functionality thoroughly
- [ ] Verify existing features still work
- [ ] Check responsive design
- [ ] Validate accessibility
- [ ] Test cross-browser compatibility

### **After Each Phase:**
- [ ] Merge to main branch
- [ ] Update documentation
- [ ] Create demo/screenshots
- [ ] Plan next phase

---

## 📋 Database Schema (Supabase)

```sql
-- Workspaces (magic link system)
workspaces (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Spaces (high-level organization)
spaces (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Collections (within spaces)
collections (
  id UUID PRIMARY KEY,
  space_id UUID REFERENCES spaces(id),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📁',
  order_index INTEGER DEFAULT 0,
  view_mode TEXT DEFAULT 'card', -- card, compact, list, grid
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Bookmarks (within collections)
bookmarks (
  id UUID PRIMARY KEY,
  collection_id UUID REFERENCES collections(id),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  preview JSONB, -- {title, description, image}
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Sharing (view-only links)
shares (
  id UUID PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id),
  view_key TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
)
```

---

## 🎯 Success Criteria

### **Phase 1 Success:**
- [ ] Users can create workspaces without accounts
- [ ] Data persists across devices via magic links
- [ ] Spaces organize collections properly
- [ ] No existing functionality breaks

### **Phase 2 Success:**
- [ ] Users can save and restore browser sessions
- [ ] Global search works across all data
- [ ] All 4 view modes function correctly
- [ ] Performance remains fast

### **Phase 3 Success:**
- [ ] Users can share workspaces view-only
- [ ] Import/export preserves data integrity
- [ ] Sharing links work across devices
- [ ] No data loss during operations

### **Phase 4 Success:**
- [ ] All 7 UX improvements work smoothly
- [ ] Users prefer the enhanced experience
- [ ] Performance remains excellent
- [ ] Accessibility standards met

---

## 📝 Notes

- **Testing Priority**: Each phase must be fully tested before moving to the next
- **Breaking Changes**: Avoid breaking existing functionality
- **Performance**: Monitor performance impact of each feature
- **User Feedback**: Gather feedback after each phase
- **Documentation**: Update docs after each phase completion

---

*Last Updated: December 2024*
*Status: Phase 3.2 Complete - Ready for Phase 4.1 (Quick Capture Mode)*
