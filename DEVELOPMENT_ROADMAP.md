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
- Collections system (missing Spaces concept)
- 3 view modes: Grid, List, Compact (missing 2-column Grid)
- Basic search functionality
- Theme system with external JSON
- Modern UI with shadcn/ui + Tailwind
- Responsive design
- Context menus and bulk actions
- Pinning system
- Settings dialog
- **Supabase integration with persistent storage**
- **Preview image extraction with manual override**
- **Favicon extraction and fallbacks**

### ❌ **Missing/Incomplete**
- Magic link system (currently demo user)
- Spaces concept (only collections exist)
- Session save/restore functionality
- Advanced search (global, filters)
- Sharing system (view-only)
- Import/export functionality
- 4th view mode (2-column Grid)
- All 7 UX improvements
- Supabase integration (currently in-memory storage)

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

#### **Phase 1.2: Magic Link System** ⏳
**Goal**: Implement anonymous workspace system
- [ ] Generate workspace IDs on first visit
- [ ] Store workspace ID in localStorage
- [ ] Create workspace URLs (`/w/:workspaceId`)
- [ ] Handle workspace loading/creation
- [ ] Test cross-device sync
- [ ] Verify no functionality breaks

#### **Phase 1.3: Spaces Concept** ⏳
**Goal**: Add Spaces hierarchy (Spaces → Collections → Bookmarks)
- [ ] Update database schema for spaces
- [ ] Add spaces UI in sidebar
- [ ] Update bookmark creation to include space selection
- [ ] Implement space switching
- [ ] Test space organization
- [ ] Verify no functionality breaks

---

### **Phase 2: Core Features**
*Priority: High - Essential Toby-like functionality*

#### **Phase 2.1: Session Save/Restore** ⏳
**Goal**: Capture and restore browser tabs
- [ ] Create browser bookmarklet for tab capture
- [ ] Implement tab data extraction
- [ ] Add "Save Session" button
- [ ] Create session preview UI
- [ ] Implement selective restore
- [ ] Test session functionality
- [ ] Verify no functionality breaks

#### **Phase 2.2: Advanced Search** ⏳
**Goal**: Global search with filters
- [ ] Implement global search across spaces/collections
- [ ] Add search filters (tags, date, domain)
- [ ] Create search results UI
- [ ] Add keyboard shortcuts (Cmd+K)
- [ ] Test search performance
- [ ] Verify no functionality breaks

#### **Phase 2.3: 4th View Mode (Grid)** ⏳
**Goal**: Complete Toby's 4 view modes
- [ ] Implement 2-column Grid layout
- [ ] Add Grid view toggle
- [ ] Ensure Grid uses Compact card style
- [ ] Test responsive behavior
- [ ] Verify no functionality breaks

---

### **Phase 3: Sharing & Export**
*Priority: Medium - Collaboration features*

#### **Phase 3.1: View-Only Sharing** ⏳
**Goal**: Share workspaces without editing
- [ ] Generate view-only links
- [ ] Implement read-only UI mode
- [ ] Disable editing in view mode
- [ ] Add share button and copy link
- [ ] Test sharing functionality
- [ ] Verify no functionality breaks

#### **Phase 3.2: Import/Export System** ⏳
**Goal**: Data portability
- [ ] Implement JSON export
- [ ] Create import functionality
- [ ] Add CSV export option
- [ ] Ensure imports create new spaces
- [ ] Test data integrity
- [ ] Verify no functionality breaks

---

### **Phase 4: UX Improvements (7 Enhancements)**
*Priority: Medium - Differentiators over Toby*

#### **Phase 4.1: Quick Capture Mode** ⏳
**Goal**: One-click save to Inbox
- [ ] Create Inbox collection concept
- [ ] Add quick capture button
- [ ] Implement auto-save to Inbox
- [ ] Add Inbox organization UI
- [ ] Test capture workflow
- [ ] Verify no functionality breaks

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

*Last Updated: [Current Date]*
*Status: Planning Phase*
