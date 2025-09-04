const { logger } = require('../../utils/logger');

/**
 * EntityCombinator - Handles combining two companies into a unified entity
 * for partnership analysis
 */
class EntityCombinator {
  /**
   * Create a combined entity from two companies
   * @param {Object} companyA - First company data
   * @param {Object} companyB - Second company data
   * @returns {Object} Combined entity with merged capabilities
   */
  createCombinedEntity(companyA, companyB) {
    const combined = {
      id: `${companyA.id}+${companyB.id}`,
      name: `${companyA.name} + ${companyB.name}`,
      type: 'partnership',
      
      // Combine capabilities
      capabilities: this.mergeCombinedCapabilities(
        companyA.capabilities || [], 
        companyB.capabilities || []
      ),
      
      // Combine certifications
      certifications: this.mergeCombinedCertifications(
        companyA.certifications || [],
        companyB.certifications || []
      ),
      
      // Combined size (larger of the two)
      size_category: this.getLargerSizeCategory(
        companyA.size_category,
        companyB.size_category
      ),
      
      // Geographic presence (union)
      regions: this.mergeRegions(
        companyA.regions || [],
        companyB.regions || []
      ),
      
      // Industry sectors (union)
      industry_sectors: this.mergeIndustrySectors(
        companyA.industry_sectors || [],
        companyB.industry_sectors || []
      ),
      
      // Combined experience (sum)
      years_in_business: Math.max(
        companyA.years_in_business || 0,
        companyB.years_in_business || 0
      ),
      
      // Track individual companies
      partnerA: companyA,
      partnerB: companyB
    };

    logger.debug(`Created combined entity: ${combined.name}`);
    return combined;
  }

  /**
   * Merge capabilities from two companies, removing duplicates and combining strength
   */
  mergeCombinedCapabilities(capA, capB) {
    const capabilityMap = new Map();
    
    // Add capabilities from company A
    capA.forEach(cap => {
      capabilityMap.set(cap.name || cap, {
        name: cap.name || cap,
        strength: cap.strength || 'medium',
        source: 'A'
      });
    });
    
    // Add capabilities from company B, upgrading strength if both have it
    capB.forEach(cap => {
      const existing = capabilityMap.get(cap.name || cap);
      if (existing) {
        // Both companies have this capability - stronger together
        capabilityMap.set(cap.name || cap, {
          name: cap.name || cap,
          strength: this.upgradeStrength(existing.strength, cap.strength || 'medium'),
          source: 'both'
        });
      } else {
        capabilityMap.set(cap.name || cap, {
          name: cap.name || cap,
          strength: cap.strength || 'medium',
          source: 'B'
        });
      }
    });
    
    return Array.from(capabilityMap.values());
  }

  /**
   * Merge certifications, removing duplicates
   */
  mergeCombinedCertifications(certA, certB) {
    const certSet = new Set([...certA, ...certB]);
    return Array.from(certSet);
  }

  /**
   * Merge geographic regions
   */
  mergeRegions(regionsA, regionsB) {
    const regionSet = new Set([...regionsA, ...regionsB]);
    return Array.from(regionSet);
  }

  /**
   * Merge industry sectors
   */
  mergeIndustrySectors(sectorsA, sectorsB) {
    const sectorSet = new Set([...sectorsA, ...sectorsB]);
    return Array.from(sectorSet);
  }

  /**
   * Upgrade capability strength when both companies have the same capability
   */
  upgradeStrength(strengthA, strengthB) {
    const strengthLevels = {
      'low': 1,
      'medium': 2,
      'high': 3,
      'expert': 4
    };

    const levelA = strengthLevels[strengthA] || 2;
    const levelB = strengthLevels[strengthB] || 2;
    
    // Combined strength is higher of the two, plus synergy bonus
    const combinedLevel = Math.min(4, Math.max(levelA, levelB) + 1);
    
    const levelNames = ['', 'low', 'medium', 'high', 'expert'];
    return levelNames[combinedLevel];
  }

  /**
   * Get the larger size category between two companies
   */
  getLargerSizeCategory(size1, size2) {
    const sizeOrder = {
      'startup': 1,
      'small': 2,
      'medium': 3,
      'large': 4,
      'enterprise': 5
    };

    const level1 = sizeOrder[size1] || 2;
    const level2 = sizeOrder[size2] || 2;
    
    const maxLevel = Math.max(level1, level2);
    const sizeNames = ['', 'startup', 'small', 'medium', 'large', 'enterprise'];
    
    return sizeNames[maxLevel];
  }
}

module.exports = { EntityCombinator };