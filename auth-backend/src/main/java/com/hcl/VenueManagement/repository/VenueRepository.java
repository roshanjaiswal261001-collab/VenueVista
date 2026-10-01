
package com.hcl.VenueManagement.repository;

import com.hcl.VenueManagement.entity.Venue;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VenueRepository extends JpaRepository<Venue, Long> {
}