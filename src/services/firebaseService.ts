import {
  collection, getDocs, query, orderBy, Firestore, DocumentData, collectionGroup, where
} from 'firebase/firestore';
import { DailyTotal, Hierarchy } from '../types';

export class FirebaseService {
  private db: Firestore;
  constructor(db: Firestore) { this.db = db; }

  async loadHierarchy(): Promise<Hierarchy> {
    const hierarchy: Hierarchy = {};
    const departmentsSnapshot = await getDocs(collection(this.db, 'departments'));

    // Fetch departments in parallel
    const deptPromises = departmentsSnapshot.docs.map(async (deptDoc) => {
      const deptId = deptDoc.id;
      const deptData = deptDoc.data();
      hierarchy[deptId] = { id: deptId, name: deptData.name || deptId, sections: {} };

      const sectionsSnapshot = await getDocs(collection(this.db, 'departments', deptId, 'sections'));

      // Fetch sections in parallel
      const sectionPromises = sectionsSnapshot.docs.map(async (sectionDoc) => {
        const sectionId = sectionDoc.id;
        const sectionData = sectionDoc.data();
        hierarchy[deptId].sections[sectionId] = { id: sectionId, name: sectionData.name || sectionId, deptId, teams: {} };

        const teamsSnapshot = await getDocs(collection(this.db, 'departments', deptId, 'sections', sectionId, 'teams'));

        // Process teams
        teamsSnapshot.docs.forEach(teamDoc => {
          const teamId = teamDoc.id;
          const teamData = teamDoc.data();
          hierarchy[deptId].sections[sectionId].teams[teamId] = {
            id: teamId,
            name: teamData.name || teamId,
            description: teamData.description || '',
            baseTeamName: teamData.base_team_name || teamData.name || teamId,
            teamLeadName: teamData.team_lead_name || '',
            teamLeadEmail: teamData.team_lead_email || '',
            sectionId,
            deptId
          };
        });
      });

      await Promise.all(sectionPromises);
    });

    await Promise.all(deptPromises);
    return hierarchy;
  }

  // Search Functions
  async searchMembers(searchTerm: string): Promise<any[]> {
    // Note: This requires a collection group index on 'name'
    const q = query(
      collectionGroup(this.db, 'members'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      // Path format: departments/{deptId}/sections/{sectionId}/teams/{teamId}/members/{memberId}
      const pathSegments = doc.ref.path.split('/');
      return {
        id: doc.id,
        ...data,
        deptId: pathSegments[1],
        sectionId: pathSegments[3],
        teamId: pathSegments[5]
      };
    });
  }

  async searchTeams(searchTerm: string): Promise<any[]> {
    const q = query(
      collectionGroup(this.db, 'teams'),
      where('name', '>=', searchTerm),
      where('name', '<=', searchTerm + '\uf8ff')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      const pathSegments = doc.ref.path.split('/');
      return {
        id: doc.id,
        ...data,
        deptId: pathSegments[1],
        sectionId: pathSegments[3]
      };
    });
  }

  async loadTeamData(deptId: string, sectionId: string, teamId: string): Promise<DailyTotal[]> {
    const membersSnapshot = await getDocs(collection(this.db, 'departments', deptId, 'sections', sectionId, 'teams', teamId, 'members'));

    // Fetch all members' data in parallel
    const memberPromises = membersSnapshot.docs.map(async (memberDoc) => {
      const memberId = memberDoc.id;
      const memberData = memberDoc.data();

      const dailyTotalsSnapshot = await getDocs(
        query(collection(this.db, 'departments', deptId, 'sections', sectionId, 'teams', teamId, 'members', memberId, 'daily_totals'), orderBy('date', 'desc'))
      );

      return dailyTotalsSnapshot.docs.map(dailyDoc =>
        this.transformDailyData(dailyDoc.data(), memberData, memberId, teamId, sectionId, deptId)
      );
    });

    const results = await Promise.all(memberPromises);
    return results.flat();
  }

  async loadSectionData(deptId: string, sectionId: string): Promise<DailyTotal[]> {
    const teamsSnapshot = await getDocs(collection(this.db, 'departments', deptId, 'sections', sectionId, 'teams'));
    const teamPromises = teamsSnapshot.docs.map(teamDoc =>
      this.loadTeamData(deptId, sectionId, teamDoc.id)
    );
    const results = await Promise.all(teamPromises);
    return results.flat();
  }

  async loadDepartmentData(deptId: string): Promise<DailyTotal[]> {
    const sectionsSnapshot = await getDocs(collection(this.db, 'departments', deptId, 'sections'));
    const sectionPromises = sectionsSnapshot.docs.map(sectionDoc =>
      this.loadSectionData(deptId, sectionDoc.id)
    );
    const results = await Promise.all(sectionPromises);
    return results.flat();
  }

  async loadAllDepartmentsData(): Promise<DailyTotal[]> {
    const departmentsSnapshot = await getDocs(collection(this.db, 'departments'));
    const deptPromises = departmentsSnapshot.docs.map(deptDoc =>
      this.loadDepartmentData(deptDoc.id)
    );
    const results = await Promise.all(deptPromises);
    return results.flat();
  }

  private transformDailyData(dailyData: DocumentData, memberData: DocumentData, memberId: string, teamId: string, sectionId: string, deptId: string): DailyTotal {
    const leetcodeTotal = dailyData.leetcode_total || 0;
    const skillrackTotal = dailyData.skillrack_total || 0;
    const codechefTotal = dailyData.codechef_total || 0;
    const hackerrankTotal = dailyData.hackerrank_total || 0;
    return {
      id: dailyData.id || `${memberId}-${dailyData.date}`,
      date: dailyData.date,
      memberId,
      memberName: memberData.name || memberId,
      email: memberData.email || '',
      teamId,
      sectionId,
      deptId,
      leetcodeTotal,
      leetcodeDailyIncrease: dailyData.leetcode_daily_increase || 0,
      skillrackTotal,
      skillrackDailyIncrease: dailyData.skillrack_daily_increase || 0,
      codechefTotal,
      codechefDailyIncrease: dailyData.codechef_daily_increase || 0,
      hackerrankTotal,
      hackerrankDailyIncrease: dailyData.hackerrank_daily_increase || 0,
      githubRepos: dailyData.github_repos || 0,
      githubDailyIncrease: dailyData.github_daily_increase || 0,
      totalSolved: leetcodeTotal + skillrackTotal + codechefTotal + hackerrankTotal,
      totalDailyIncrease: (dailyData.leetcode_daily_increase || 0) + (dailyData.skillrack_daily_increase || 0) + (dailyData.codechef_daily_increase || 0) + (dailyData.hackerrank_daily_increase || 0),
      assignedTeamLead: memberData.assigned_team_lead || '',
      isTeamLead: memberData.is_team_lead || false,
      assignedBatch: memberData.assigned_batch || '',
      leetcodeUrl: memberData.profiles?.leetcode_url || '',
      skillrackUrl: memberData.profiles?.skillrack_url || '',
      codechefUrl: memberData.profiles?.codechef_url || '',
      hackerrankUrl: memberData.profiles?.hackerrank_url || '',
      githubUrl: memberData.profiles?.github_url || ''
    };
  }
}
